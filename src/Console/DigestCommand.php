<?php

declare(strict_types=1);

namespace Canvas\Console;

use Canvas\Mail\WeeklyDigest;
use Canvas\Models\Post;
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
        $startDate = today()->subDays(7)->startOfDay();
        $endDate = today()->endOfDay();

        $userModel = config('canvas.user_model');

        $recipients = $userModel::with('canvasUser')
            ->whereHas('canvasUser', fn (Builder $query) => $query->where('digest', true))
            ->whereIn('id', Post::published()->pluck('user_id')->unique())
            ->get();

        foreach ($recipients as $user) {
            $posts = Post::where('user_id', $user->id)
                ->published()
                ->withCount([
                    'views' => fn (Builder $query) => $query->whereBetween('created_at', [$startDate, $endDate]),
                    'visits' => fn (Builder $query) => $query->whereBetween('created_at', [$startDate, $endDate]),
                ])
                ->get();

            Mail::to($user->email)->send(new WeeklyDigest(
                posts: $posts->toArray(),
                totals: [
                    'views' => $posts->sum('views_count'),
                    'visits' => $posts->sum('visits_count'),
                ],
                startDate: $startDate->format('M j'),
                endDate: $endDate->format('M j'),
                locale: $user->locale,
            ));
        }

        return self::SUCCESS;
    }
}
