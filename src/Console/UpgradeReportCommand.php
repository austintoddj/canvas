<?php

declare(strict_types=1);

namespace Canvas\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class UpgradeReportCommand extends Command
{
    protected $signature = 'canvas:upgrade-report';

    protected $description = 'Report Canvas schema/data readiness for v6→v7 upgrades (read-only)';

    public function handle(): int
    {
        $this->info('Canvas upgrade report (read-only)');
        $this->newLine();

        if (! Schema::hasTable('canvas_users')) {
            $this->warn('canvas_users is missing. Fresh install? Run: php artisan canvas:migrate');
            $this->line('v6 data reshape steps: see UPGRADE.md');

            return self::SUCCESS;
        }

        $this->line('Schema signals');
        $this->table(['Check', 'Result'], [
            ['canvas_users.email (v6)', Schema::hasColumn('canvas_users', 'email') ? 'present' : 'absent'],
            ['canvas_users.user_id (v7 PK)', Schema::hasColumn('canvas_users', 'user_id') ? 'present' : 'absent'],
            ['canvas_posts.topic_id', Schema::hasColumn('canvas_posts', 'topic_id') ? 'present' : 'absent'],
            ['canvas_posts_topics pivot', Schema::hasTable('canvas_posts_topics') ? 'present' : 'absent'],
            ['host users table', Schema::hasTable('users') ? 'present' : 'absent'],
        ]);

        $scenario = $this->likelyScenario();
        $this->newLine();
        $this->line("Likely path: <fg=cyan>{$scenario}</>");
        $this->newLine();

        $this->line('Orphan / pivot counts (expect 0 after a successful upgrade)');
        $this->table(['Metric', 'Count'], [
            ['canvas_users without host user', (string) $this->countCanvasUsersMissingHost()],
            ['canvas_posts.user_id orphans', (string) $this->countOrphanUserIds('canvas_posts')],
            ['canvas_tags.user_id orphans', (string) $this->countOrphanUserIds('canvas_tags')],
            ['canvas_topics.user_id orphans', (string) $this->countOrphanUserIds('canvas_topics')],
            ['canvas_media.user_id orphans', (string) $this->countOrphanUserIds('canvas_media')],
            ['canvas_posts_topics rows', (string) $this->countPivotRows()],
            ['canvas_users with digest + null timezone', (string) $this->countDigestMissingTimezone()],
        ]);

        $this->newLine();
        $this->line('Next steps');
        $this->line('- Schema only (fresh): php artisan canvas:migrate');
        $this->line('- v6 data reshape SQL packs: resources/upgrade/ (published with the package source)');
        $this->line('- Playbooks: UPGRADE.md → Scenario A / Scenario B / topics pivot');
        $this->line('- Smoke: php artisan canvas:list-users && open /canvas while signed in');
        $this->line('- Digest: opted-in users need a valid IANA timezone on canvas_users.timezone');

        return self::SUCCESS;
    }

    private function likelyScenario(): string
    {
        $hasEmail = Schema::hasColumn('canvas_users', 'email');
        $hasUserId = Schema::hasColumn('canvas_users', 'user_id');

        if ($hasEmail) {
            return 'v6-style canvas_users (has email) — follow UPGRADE.md Scenario A or B; canvas:migrate will not reshape rows';
        }

        if ($hasUserId) {
            if (Schema::hasTable('canvas_posts_topics')) {
                return 'v7 canvas_users shape, but topics pivot still exists — migrate pivot to topic_id';
            }

            return 'v7-style canvas_users — verify orphans and run smoke checks';
        }

        return 'Unrecognized canvas_users shape — inspect manually against UPGRADE.md';
    }

    private function countCanvasUsersMissingHost(): int
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('canvas_users', 'user_id')) {
            return Schema::hasColumn('canvas_users', 'user_id') ? -1 : 0;
        }

        try {
            return (int) DB::table('canvas_users as cu')
                ->leftJoin('users as u', 'u.id', '=', 'cu.user_id')
                ->whereNull('u.id')
                ->count();
        } catch (Throwable) {
            return -1;
        }
    }

    private function countOrphanUserIds(string $table): int
    {
        if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'user_id') || ! Schema::hasTable('users')) {
            return 0;
        }

        try {
            return (int) DB::table("{$table} as t")
                ->leftJoin('users as u', 'u.id', '=', 't.user_id')
                ->whereNotNull('t.user_id')
                ->whereNull('u.id')
                ->count();
        } catch (Throwable) {
            return -1;
        }
    }

    private function countPivotRows(): int
    {
        if (! Schema::hasTable('canvas_posts_topics')) {
            return 0;
        }

        try {
            return (int) DB::table('canvas_posts_topics')->count();
        } catch (Throwable) {
            return -1;
        }
    }

    private function countDigestMissingTimezone(): int
    {
        if (! Schema::hasColumn('canvas_users', 'digest') || ! Schema::hasColumn('canvas_users', 'timezone')) {
            return 0;
        }

        try {
            return (int) DB::table('canvas_users')
                ->where('digest', true)
                ->where(function ($query): void {
                    $query->whereNull('timezone')->orWhere('timezone', '');
                })
                ->count();
        } catch (Throwable) {
            return -1;
        }
    }
}
