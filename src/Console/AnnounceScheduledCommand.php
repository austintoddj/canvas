<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Models\Post;
use Canvas\Support\PostLifecycleEvents;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

class AnnounceScheduledCommand extends Command
{
    private const CHUNK = 100;

    protected $signature = 'canvas:announce-scheduled';

    protected $description = 'Fire PostPublished for scheduled posts that have become live';

    public function handle(): int
    {
        $failed = 0;

        Post::query()
            ->published()
            ->whereNull('published_notified_at')
            ->orderBy('id')
            ->chunkById(self::CHUNK, function (Collection $posts) use (&$failed): void {
                foreach ($posts as $post) {
                    /** @var Post $post */
                    try {
                        $this->announce($post);
                    } catch (Throwable $exception) {
                        $failed++;
                        report($exception);
                        $this->error("Failed to announce post [{$post->id}]: {$exception->getMessage()}");
                    }
                }
            });

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    private function announce(Post $post): void
    {
        DB::transaction(function () use ($post): void {
            /** @var Post|null $locked */
            $locked = Post::query()
                ->whereKey($post->id)
                ->whereNull('published_notified_at')
                ->lockForUpdate()
                ->first();

            if ($locked === null) {
                return;
            }

            if ($locked->published_at === null || $locked->published_at->gt(now())) {
                return;
            }

            PostLifecycleEvents::dispatchScheduledWentLive($locked);
        });
    }
}
