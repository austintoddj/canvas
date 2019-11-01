<?php

namespace Canvas;

use Carbon\Carbon;
use Carbon\CarbonInterval;
use DateInterval;
use DatePeriod;
use Illuminate\Support\Collection;

trait Trends
{
    /**
     * Return an array of view counts for a given number of days.
     *
     * @param Collection $views
     * @param int $days
     * @return array
     */
    public function getViewCounts(Collection $views, int $days = 1): array
    {
        // Filter the view data to only include created_at date strings
        $filtered_views = collect();
        $views->sortBy('created_at')->each(function ($item, $key) use ($filtered_views) {
            $filtered_views->push($item->created_at->toDateString());
        });

        // Count the unique values and assign to their respective keys
        $unique_views = array_count_values($filtered_views->toArray());

        // Create a [X] day range to hold the default date values
        $period = $this->generateDateRange(today()->subDays($days), CarbonInterval::day(), $days);

        // Compare the view data and date range arrays, assigning view counts where applicable
        $total = collect();

        foreach ($period as $date) {
            array_key_exists($date, $unique_views) ? $total->put($date, $unique_views[$date]) : $total->put($date, 0);
        }

        return $total->toArray();
    }

    /**
     * Generate a date range array of formatted strings.
     *
     * @param Carbon $start_date
     * @param DateInterval $interval
     * @param int $recurrences
     * @param int $exclusive
     * @return array
     */
    private function generateDateRange(Carbon $start_date, DateInterval $interval, int $recurrences, int $exclusive = 1): array
    {
        $period = new DatePeriod($start_date, $interval, $recurrences, $exclusive);
        $dates = collect();

        foreach ($period as $date) {
            $dates->push($date->format('Y-m-d'));
        }

        return $dates->toArray();
    }
}
