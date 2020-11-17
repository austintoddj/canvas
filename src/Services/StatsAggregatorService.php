<?php

namespace Canvas\Services;

use Canvas\Models\Post;
use Canvas\Models\User;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Carbon\CarbonInterval;
use DateInterval;
use DatePeriod;
use DateTimeInterface;
use Illuminate\Support\Collection;

class StatsAggregatorService
{
    /**
     * Get aggregate statistics data for counts and chart.
     *
     * @param User $user
     * @param string $scope
     * @param int $days
     * @return array
     */
    public static function getByUserAndScope(User $user, string $scope, int $days): array
    {
        $posts = Post::when($scope, function ($query, $scope) use ($user) {
            if ($scope === 'all') {
                return $query;
            }

            return $query->where('user_id', $user->id);
        })->published()->latest()->get();

        $views = View::select('created_at')
                     ->whereIn('post_id', $posts->pluck('id'))
                     ->whereBetween('created_at', [
                         today()->subDays($days)->startOfDay()->toDateTimeString(),
                         today()->endOfDay()->toDateTimeString(),
                     ])->get();

        $visits = View::selectRaw('ip, agent, DATE(created_at) as created_at')
                     ->whereIn('post_id', $posts->pluck('id'))
                     ->distinct('ip, agent, day')
                     ->whereBetween('created_at', [
                         today()->subDays($days)->startOfDay()->toDateTimeString(),
                         today()->endOfDay()->toDateTimeString(),
                     ])->get();

        return [
            'totalViews' => $views->count(),
            'totalVisits' => $visits->count(),
            'traffic' => [
                'views' => self::calculateTotalForDays($views, $days)->toJson(),
                'visits' => self::calculateTotalForDays($visits, $days)->toJson(),
            ],
        ];
    }

    /**
     * Get individual statistics data for a given post.
     *
     * @param Post $post
     * @param int $days
     * @return array
     */
    public static function getForPost(Post $post, int $days): array
    {
        $views = View::where('post_id', $post->id)->get();

        $previousMonthlyViews = $views->whereBetween('created_at', [
            today()->subMonth()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonth()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $currentMonthlyViews = $views->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $lastThirtyDays = $views->whereBetween('created_at', [
            today()->subDays(30)->startOfDay()->toDateTimeString(),
            today()->endOfDay()->toDateTimeString(),
        ]);

        $visits = Visit::where('post_id', $post->id)->get();

        $previousMonthlyVisits = $visits->whereBetween('created_at', [
            today()->subMonth()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonth()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $currentMonthlyVisits = $visits->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        return [
            'post' => $post,
            'readTime' => $post->read_time,
            'popularReadingTimes' => $post->popular_reading_times,
            'topReferers' => $post->top_referers,
            'monthlyViews' => $currentMonthlyViews->count(),
            'totalViews' => $views->count(),
            'monthlyVisits' => $currentMonthlyVisits->count(),
            'monthOverMonthViews' => self::compareMonthOverMonth($currentMonthlyViews, $previousMonthlyViews),
            'monthOverMonthVisits' => self::compareMonthOverMonth($currentMonthlyVisits, $previousMonthlyVisits),
            'traffic' => [
                'views' => self::calculateTotalForDays($lastThirtyDays, $days)->toJson(),
                'visits' => self::calculateTotalForDays($visits, $days)->toJson(),
            ],
        ];
    }

    /**
     * Given a collection of Views or Visits, return an array of formatted
     * date strings and their related counts for a given number of days.
     *
     * example: [ Y-m-d => total ]
     *
     * @param Collection $data
     * @param int $days
     * @return Collection
     */
    protected static function calculateTotalForDays(Collection $data, int $days = 30): Collection
    {
        // Filter the data to only include created_at date strings
        $filtered = collect();
        $data->sortBy('created_at')->each(function ($item) use ($filtered) {
            $filtered->push($item->created_at->toDateString());
        });

        // Count the unique values and assign to their respective keys
        $unique = array_count_values($filtered->toArray());

        // Create a day range to hold the default date values
        $period = self::generateRange(today()->subDays($days), CarbonInterval::day(), $days);

        // Compare the data and date range arrays, assigning counts where applicable
        $total = collect();

        foreach ($period as $date) {
            if (array_key_exists($date, $unique)) {
                $total->put($date, $unique[$date]);
            } else {
                $total->put($date, 0);
            }
        }

        return $total;
    }

    /**
     * Given two collections of monthly data, compare the totals and return the
     * overall directional trend as well as the percentage increase/decrease.
     *
     * @param Collection $current
     * @param Collection $previous
     * @return array
     */
    protected static function compareMonthOverMonth(Collection $current, Collection $previous): array
    {
        $dataCountThisMonth = $current->count();
        $dataCountLastMonth = $previous->count();

        if ($dataCountLastMonth != 0) {
            $difference = (int) $dataCountThisMonth - (int) $dataCountLastMonth;
            $growth = ($difference / $dataCountLastMonth) * 100;
        } else {
            $growth = $dataCountThisMonth * 100;
        }

        return [
            'direction' => $dataCountThisMonth > $dataCountLastMonth ? 'up' : 'down',
            'percentage' => number_format(abs($growth)),
        ];
    }

    /**
     * Generate a date range array of formatted strings.
     *
     * @param DateTimeInterface $start_date
     * @param DateInterval $interval
     * @param int $recurrences
     * @param int $exclusive
     * @return array
     */
    protected static function generateRange(DateTimeInterface $start_date, DateInterval $interval, int $recurrences, int $exclusive = 1): array
    {
        $period = new DatePeriod($start_date, $interval, $recurrences, $exclusive);
        $dates = collect();

        foreach ($period as $date) {
            $dates->push($date->format('Y-m-d'));
        }

        return $dates->toArray();
    }
}
