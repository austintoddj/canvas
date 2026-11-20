<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Support\ContentLocales;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TranslatePostsCommand extends Command
{
    protected $signature = 'canvas:translate-posts {--locale= : Language of existing posts} {--dry-run : Count without writing}';

    protected $description = 'Copy existing posts and revisions into the primary content language';

    public function handle(): int
    {
        $locale = $this->option('locale');
        if (! is_string($locale) || $locale !== ContentLocales::default() || ! in_array($locale, ContentLocales::all(), true)) {
            $this->error('Specify the configured default content locale using --locale.');

            return self::FAILURE;
        }
        $previous = DB::table('canvas_settings')->where('key', 'content.default_locale')->value('value');
        if ($previous !== null && $previous !== $locale) {
            $this->error('Changing the default content locale requires a separate data migration.');

            return self::FAILURE;
        }
        // The raw query deliberately includes soft-deleted posts and preserves stored HTML/dates.
        $count = DB::table('canvas_posts')->count();
        if ($this->option('dry-run')) {
            $this->info("{$count} posts would be synchronized to [{$locale}].");

            return self::SUCCESS;
        }
        DB::table('canvas_settings')->updateOrInsert(['key' => 'content.default_locale'], ['value' => $locale]);
        DB::table('canvas_posts')->orderBy('id')->chunkById(100, function ($posts) use ($locale): void {
            foreach ($posts as $post) {
                DB::transaction(function () use ($post, $locale): void {
                    $post = DB::table('canvas_posts')->where('id', $post->id)->lockForUpdate()->first();
                    $data = [];
                    foreach (['title', 'summary', 'body', 'meta', 'published_at', 'published_notified_at', 'pending', 'created_at', 'updated_at'] as $field) {
                        $data[$field] = $post->{$field};
                    }
                    DB::table('canvas_post_translations')->updateOrInsert(['post_id' => $post->id, 'locale' => $locale], $data);
                    DB::table('canvas_post_revisions')->where('post_id', $post->id)->whereNull('locale')->update(['locale' => $locale]);
                });
            }
        });
        $this->info("Synchronized {$count} posts to [{$locale}].");

        return self::SUCCESS;
    }
}
