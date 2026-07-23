<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Support\DigestPeriod;
use Canvas\Support\Localization;
use Canvas\Support\ReadTime;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;

class DigestCommand extends Command
{
    private const POST_LIMIT = 10;

    private const RECIPIENT_CHUNK = 100;

    protected $signature = 'canvas:digest';

    protected $description = 'Send the weekly email digest';

    public function handle(): int
    {
        /** @var class-string<Model> $userModel */
        $userModel = config('canvas.user_model');

        $publishedAuthorIds = Post::published()
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->unique()
            ->filter()
            ->values();

        if ($publishedAuthorIds->isEmpty()) {
            return self::SUCCESS;
        }

        CanvasUser::query()
            ->where('digest', true)
            ->whereIn('user_id', $publishedAuthorIds)
            ->orderBy('id')
            ->chunkById(self::RECIPIENT_CHUNK, function (Collection $canvasUsers) use ($userModel): void {
                $hosts = $userModel::query()
                    ->whereIn('id', $canvasUsers->pluck('user_id'))
                    ->get()
                    ->keyBy(fn (Model $user): int|string => $user->getKey());

                foreach ($canvasUsers as $canvasUser) {
                    /** @var CanvasUser $canvasUser */
                    $user = $hosts->get($canvasUser->user_id);

                    if ($user === null) {
                        continue;
                    }

                    $email = data_get($user, 'email');
                    $name = data_get($user, 'name');

                    if (! is_string($email) || $email === '' || ! is_string($name) || $name === '') {
                        continue;
                    }

                    $translationLocale = Localization::resolveTranslationLocale($canvasUser->locale);
                    $period = DigestPeriod::forTimezone($canvasUser->timezone);

                    $posts = Post::query()
                        ->where('user_id', $canvasUser->user_id)
                        ->published()
                        ->withCount([
                            'views' => fn (Builder $query) => $query->whereBetween('created_at', [
                                $period->startUtc(),
                                $period->endUtc(),
                            ]),
                            'visits' => fn (Builder $query) => $query->whereBetween('created_at', [
                                $period->startUtc(),
                                $period->endUtc(),
                            ]),
                        ])
                        ->orderByDesc('views_count')
                        ->get();

                    $totals = [
                        'views' => (int) $posts->sum('views_count'),
                        'visits' => (int) $posts->sum('visits_count'),
                    ];

                    if ($totals['views'] === 0 && $totals['visits'] === 0) {
                        continue;
                    }

                    $topPosts = $posts
                        ->filter(fn (Post $post): bool => $post->views_count > 0 || $post->visits_count > 0)
                        ->take(self::POST_LIMIT)
                        ->map(fn (Post $post): array => [
                            'id' => $post->id,
                            'title' => $post->title,
                            'summary' => $post->summary,
                            'views_count' => (int) $post->views_count,
                            'visits_count' => (int) $post->visits_count,
                            'read_time' => ReadTime::calculate($post->body, $translationLocale),
                        ])
                        ->values()
                        ->all();

                    Mail::to($email)
                        ->locale($translationLocale)
                        ->send(new WeeklyDigest(
                            userName: $name,
                            posts: $topPosts,
                            totals: $totals,
                            startDate: $period->formattedStart($translationLocale),
                            endDate: $period->formattedEnd($translationLocale),
                            timezone: $period->timezone,
                        ));
                }
            });

        return self::SUCCESS;
    }
}
