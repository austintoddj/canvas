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
use Illuminate\Support\Facades\Mail;

class DigestCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'canvas:digest';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send the weekly email digest';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $userModel = config('canvas.user_model');

        $digestUserIds = CanvasUser::query()
            ->where('digest', true)
            ->pluck('user_id');

        $publishedAuthorIds = Post::published()->pluck('user_id')->unique();

        $recipients = $userModel::query()
            ->whereIn('id', $digestUserIds->intersect($publishedAuthorIds))
            ->with('canvasUser')
            ->get();

        foreach ($recipients as $user) {
            $period = DigestPeriod::forTimezone($user->canvasUser?->timezone);

            $posts = Post::where('user_id', $user->id)
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

            Mail::to($user->email)
                ->locale(Localization::resolveLocale($user->canvasUser?->locale))
                ->send(new WeeklyDigest(
                    userName: $user->name,
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
