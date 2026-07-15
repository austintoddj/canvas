<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Support\DigestPeriod;
use Canvas\Support\Localization;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Mail;

class DigestCommand extends Command
{
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

        $canvasUsers = CanvasUser::query()
            ->where('digest', true)
            ->whereIn('user_id', $publishedAuthorIds)
            ->get()
            ->keyBy('user_id');

        if ($canvasUsers->isEmpty()) {
            return self::SUCCESS;
        }

        $hosts = $userModel::query()
            ->whereIn('id', $canvasUsers->keys())
            ->get()
            ->keyBy(fn (Model $user): int|string => $user->getKey());

        foreach ($canvasUsers as $userId => $canvasUser) {
            $user = $hosts->get($userId);

            if ($user === null) {
                continue;
            }

            $email = data_get($user, 'email');
            $name = data_get($user, 'name');

            if (! is_string($email) || $email === '' || ! is_string($name)) {
                continue;
            }

            $period = DigestPeriod::forTimezone($canvasUser->timezone);

            $posts = Post::query()
                ->where('user_id', $userId)
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

            Mail::to($email)
                ->locale(Localization::resolveTranslationLocale($canvasUser->locale))
                ->send(new WeeklyDigest(
                    userName: $name,
                    posts: $posts->toArray(),
                    totals: [
                        'views' => $posts->sum('views_count'),
                        'visits' => $posts->sum('visits_count'),
                    ],
                    startDate: $period->formattedStart(),
                    endDate: $period->formattedEnd(),
                    timezone: $period->timezone,
                ));
        }

        return self::SUCCESS;
    }
}
