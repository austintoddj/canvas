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
     * @param Collection $data
     * @param int $daysToLookBack
     * @return array
     */
    public function getDataPoints(Collection $data, int $daysToLookBack = 1): array
    {
        // Filter the data to only include created_at date strings
        $filtered = collect();
        $data->sortBy('created_at')->each(function ($item, $key) use ($filtered) {
            $filtered->push($item->created_at->toDateString());
        });

        // Count the unique values and assign to their respective keys
        $unique = array_count_values($filtered->toArray());

        // Create a [X] day range to hold the default date values
        $period = $this->generateDateRange(today()->subDays($daysToLookBack), CarbonInterval::day(), $daysToLookBack);

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
     * Compare values of a data collection to evaluate month over month change.
     *
     * @param Collection $current
     * @param Collection $previous
     * @return array
     */
    public function compareMonthToMonth(Collection $current, Collection $previous)
    {
        $dataCountLastMonth = $previous->count();
        $dataCountThisMonth = $current->count();

        if ($dataCountLastMonth != 0) {
            $difference = (int) $dataCountLastMonth - (int) $dataCountThisMonth;
            $growth = ($difference / $dataCountLastMonth) * 100;
        } else {
            $growth = $dataCountThisMonth * 100;
        }

        return [
            'direction' => $dataCountThisMonth > $dataCountLastMonth ? 'up' : 'down',
            'percentage' => number_format($growth),
        ];
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
