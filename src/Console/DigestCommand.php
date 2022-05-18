<?php

namespace Canvas\Console;

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\Post;
use Canvas\Models\User;
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
     *
     * @return void
     */
    public function handle()
    {
        $startDate = today()->subWeek()->startOfDay();
        $endDate = today()->endOfDay();

        // Grab users that have published content
        $recipients = User::query()->whereIn('id', Post::query()->published()->pluck('user_id')->unique())->get();

        foreach ($recipients as $user) {
            // Skip users that have opted out of email notifications
            if (! $user->digest) {
                continue;
            }

            // Grab user posts with associated traffic totals
            $posts = Post::query()
                ->where('user_id', $user->id)
                ->published()
                ->withCount([
                    'views' => function (Builder $query) use ($startDate, $endDate) {
                        $query->whereBetween('created_at', [
                            $startDate,
                            $endDate,
                        ]);
                    },
                ])
                ->withCount([
                    'visits' => function (Builder $query) use ($startDate, $endDate) {
                        $query->whereBetween('created_at', [
                            $startDate,
                            $endDate,
                        ]);
                    },
                ])
                ->get();

            // Send the email
            Mail::to($user->email)->send(new WeeklyDigest([
                'posts' => $posts->toArray(),
                'totals' => [
                    'views' => $posts->sum('views_count'),
                    'visits' => $posts->sum('visits_count'),
                ],
                'startDate' => $startDate->format('M j'),
                'endDate' => $endDate->format('M j'),
                'locale' => $user->locale,
            ]));
        }
    }
}
