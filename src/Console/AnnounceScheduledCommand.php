<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Models\Post;
use Canvas\Models\PostTranslation;
use Canvas\Support\ContentLocales;
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
        if (ContentLocales::enabled()) {
            return $this->announceTranslations();
        }
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

    private function announceTranslations(): int
    {
        $failed = 0;
        PostTranslation::query()
            ->whereHas('post')
            ->whereIn('locale', ContentLocales::all())
            ->where('published_at', '<=', now())
            ->whereNull('published_notified_at')
            ->orderBy('id')
            ->chunkById(self::CHUNK, function ($translations) use (&$failed): void {
                foreach ($translations as $translation) {
                    try {
                        DB::transaction(function () use ($translation): void {
                            $post = Post::query()->lockForUpdate()->find($translation->post_id);
                            if ($post === null) {
                                return;
                            }
                            $post->inLocale($translation->locale);
                            if ($post->published && $post->published_notified_at === null) {
                                PostLifecycleEvents::dispatchScheduledWentLive($post);
                            }
                        });
                    } catch (Throwable $exception) {
                        $failed++;
                        report($exception);
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
