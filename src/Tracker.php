<?php

namespace Canvas;

use Carbon\CarbonInterval;
use DateInterval;
use DatePeriod;
use DateTimeInterface;
use Illuminate\Support\Collection;

trait Tracker
{
    /**
     * Get post-specific tracking data along with totals.
     *
     * @param array $postIDs
     * @param int $days
     * @return array
     */
    public function getTrackedData(array $postIDs, int $days): array
    {
        $startDate = today()->subDays($days)->startOfDay();
        $endDate = today()->endOfDay();

        $totalViews = View::forPostsInRange($postIDs, $startDate->toDateTimeString(), $endDate->toDateTimeString())->get();
        $totalVisits = Visit::forPostsInRange($postIDs, $startDate->toDateTimeString(), $endDate->toDateTimeString())->get();

        $data = collect();
        foreach ($postIDs as $postID) {
            $viewCount = $totalViews->where('post_id', $postID)->count();
            $visitCount = $totalVisits->where('post_id', $postID)->count();

            // Only collect view data if any exists
            if (array_sum([$viewCount, $visitCount]) > 0) {
                $post = Post::find($postID);
                $data->put($post->id, [
                    'title' => $post->title,
                    'views' => $viewCount,
                    'visits' => $visitCount,
                ]);
            }
        }

        return collect([
            'posts' => $data,
            'startDate' => $startDate->format('M j'),
            'endDate' => $endDate->format('M j'),
            'totals' => [
                'views' => $totalViews->count(),
                'visits' => $totalVisits->count(),
            ],
        ])->toArray();
    }

    /**
     * Return an array of tracking data for a given number of days compatible with Chart.js.
     *
     * output:
     * [
     *      2020-01-24 => 25,
     *      2020-01-25 => 13,
     *      ...
     * ]
     *
     * @param Collection $data
     * @param int $days
     * @return array
     */
    public function countTrackedData(Collection $data, int $days = 1): array
    {
        // Filter the data to only include created_at date strings
        $filtered = collect();
        $data->sortBy('created_at')->each(function ($item, $key) use ($filtered) {
            $filtered->push($item->created_at->toDateString());
        });

        // Count the unique values and assign to their respective keys
        $unique = array_count_values($filtered->toArray());

        // Create a day range to hold the default date values
        $period = $this->generateDateRange(today()->subDays($days), CarbonInterval::day(), $days);

        // Compare the data and date range arrays, assigning counts where applicable
        $total = collect();

        foreach ($period as $date) {
            if (array_key_exists($date, $unique)) {
                $total->put($date, $unique[$date]);
            } else {
                $total->put($date, 0);
            }
        }

        return $total->toArray();
    }

    /**
     * Given two collections of monthly data, compare the totals and return the
     * overall directional trend as well as the percentage increase/decrease.
     *
     * @param Collection $current
     * @param Collection $previous
     * @return array
     */
    public function compareMonthToMonth(Collection $current, Collection $previous): array
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
    private function generateDateRange(DateTimeInterface $start_date, DateInterval $interval, int $recurrences, int $exclusive = 1): array
    {
        $period = new DatePeriod($start_date, $interval, $recurrences, $exclusive);
        $dates = collect();

        foreach ($period as $date) {
            $dates->push($date->format('Y-m-d'));
        }

        return $dates->toArray();
    }
}
