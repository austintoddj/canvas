<?php

namespace Canvas\Helpers;

use Carbon\CarbonInterval;
use DateInterval;
use DatePeriod;
use DateTimeInterface;
use Illuminate\Support\Collection;

class Traffic
{
    /**
     * Given a collection of Views or Visits, return an array of formatted
     * date strings and their related counts for a given number of days.
     *
     * example: [ Y-m-d => total ]
     *
     * @param Collection $data
     * @param int $days
     * @return array
     */
    public static function calculateTotalForDays(Collection $data, int $days = 30): array
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
    public static function compareMonthOverMonth(Collection $current, Collection $previous): array
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
    private static function generateRange(DateTimeInterface $start_date, DateInterval $interval, int $recurrences, int $exclusive = 1): array
    {
        $period = new DatePeriod($start_date, $interval, $recurrences, $exclusive);
        $dates = collect();

        foreach ($period as $date) {
            $dates->push($date->format('Y-m-d'));
        }

        return $dates->toArray();
    }
}
