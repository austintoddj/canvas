<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Models\PostRevision;
use Canvas\Support\RecordPostRevision;
use Illuminate\Console\Command;

class PrunePostRevisionsCommand extends Command
{
    protected $signature = 'canvas:prune-post-revisions
                            {--keep=50 : Keep the newest N checkpoints per post}';

    protected $description = 'Delete excess post revision checkpoints beyond the per-post retention limit';

    public function handle(): int
    {
        $keep = max(1, (int) $this->option('keep'));

        $postIds = PostRevision::query()
            ->select('post_id')
            ->groupBy('post_id')
            ->havingRaw('count(*) > ?', [$keep])
            ->pluck('post_id');

        $deleted = 0;

        foreach ($postIds as $postId) {
            $deleted += RecordPostRevision::pruneExcessForPostId((string) $postId, $keep);
        }

        $this->info("Deleted {$deleted} post revision row(s) (kept {$keep} per post).");

        return self::SUCCESS;
    }
}
