<?php

namespace Canvas\Services;

use Canvas\Canvas;
use Canvas\Models\Post;
use Canvas\Models\User;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Carbon\CarbonInterval;
use DateInterval;
use DatePeriod;
use DateTimeInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Str;

class StatsAggregator
{
    /**
     * The authenticated user instance.
     *
     * @var User
     */
    protected $user;

    /**
     * Create a new service instance.
     *
     * @param  User  $user
     */
    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * Get monthly insights on a given set of posts.
     *
     * @param  Collection  $posts
     * @param  int  $days
     * @return array
     */
    public function getStatsForPosts(Collection $posts, int $days = 30): array
    {
        $views = View::query()
                     ->select('created_at')
                     ->whereIn('post_id', $posts->pluck('id'))
                     ->whereBetween('created_at', [
                         today()->subDays($days)->startOfDay()->toDateTimeString(),
                         today()->endOfDay()->toDateTimeString(),
                     ])->get();

        $visits = Visit::query()
                       ->select('created_at')
                       ->whereIn('post_id', $posts->pluck('id'))
                       ->whereBetween('created_at', [
                           today()->subDays($days)->startOfDay()->toDateTimeString(),
                           today()->endOfDay()->toDateTimeString(),
                       ])->get();

        return [
            'views' => $views->count(),
            'visits' => $visits->count(),
            'graph' => [
                'views' => $this->calculateTotalForDays($views, $days)->toJson(),
                'visits' => $this->calculateTotalForDays($visits, $days)->toJson(),
            ],
        ];
    }

    /**
     * Get total insights on a given post.
     *
     * @param  Post  $post
     * @return array
     */
    public function getStatsForPost(Post $post): array
    {
        $currentViews = $post->views->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $currentVisits = $post->visits->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $previousViews = $post->views->whereBetween('created_at', [
            today()->subMonthNoOverflow()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonthNoOverflow()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        $previousVisits = $post->visits->whereBetween('created_at', [
            today()->subMonthNoOverflow()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonthNoOverflow()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        return [
            'post' => $post,
            'readTime' => $this->calculateReadTime($post->body),
            'popularReadingTimes' => $this->calculatePopularReadingTimes($post),
            'topReferers' => $this->calculateTopReferers($post),
            'monthlyViews' => $currentViews->count(),
            'totalViews' => $post->views->count(),
            'monthlyVisits' => $currentVisits->count(),
            'monthOverMonthViews' => $this->compareMonthOverMonth($currentViews, $previousViews),
            'monthOverMonthVisits' => $this->compareMonthOverMonth($currentVisits, $previousVisits),
            'graph' => [
                'views' => $this->calculateTotalForDays($currentViews, 30)->toJson(),
                'visits' => $this->calculateTotalForDays($currentVisits, 30)->toJson(),
            ],
        ];
    }

    /**
     * Given a collection of Views or Visits, return an array of formatted
     * date strings and their related counts for a given number of days.
     *
     * example: [ Y-m-d => total ]
     *
     * @param  Collection  $data
     * @param  int  $days
     * @return Collection
     */
    protected function calculateTotalForDays(Collection $data, int $days = 30): Collection
    {
        // Filter the data to only include created_at date strings
        $filtered = new Collection();

        $data->sortBy('created_at')->each(function ($item) use ($filtered) {
            $filtered->push($item->created_at->toDateString());
        });

        // Count the unique values and assign to their respective keys
        $unique = array_count_values($filtered->toArray());

        // Create a day range to hold the default date values
        $period = $this->generateDateRange(today()->subDays($days), CarbonInterval::day(), $days);

        // Compare the data and date range arrays, assigning counts where applicable
        $results = new Collection();

        foreach ($period as $date) {
            if (array_key_exists($date, $unique)) {
                $results->put($date, $unique[$date]);
            } else {
                $results->put($date, 0);
            }
        }

        return $results;
    }

    /**
     * Given two collections of monthly data, compare the totals and return the
     * overall directional trend as well as the percentage increase/decrease.
     *
     * @param  Collection  $current
     * @param  Collection  $previous
     * @return array
     */
    protected function compareMonthOverMonth(Collection $current, Collection $previous): array
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
     * @param  DateTimeInterface  $start_date
     * @param  DateInterval  $interval
     * @param  int  $recurrences
     * @param  int  $exclusive
     * @return array
     */
    protected function generateDateRange(
        DateTimeInterface $start_date,
        DateInterval $interval,
        int $recurrences,
        int $exclusive = 1
    ): array {
        $period = new DatePeriod($start_date, $interval, $recurrences, $exclusive);
        $dates = new Collection();

        foreach ($period as $date) {
            $dates->push($date->format('Y-m-d'));
        }

        return $dates->toArray();
    }

    /**
     * Get the human-friendly estimated reading time of a given text.
     *
     * @param  null|string  $text
     * @return string
     */
    protected function calculateReadTime(?string $text): string
    {
        // Only count words in our estimation
        $words = str_word_count(strip_tags($text));

        // Divide by the average number of words per minute
        $minutes = ceil($words / 250);

        // The user is optional since we append this attribute
        // to every model and we may be creating a new one
        return sprintf('%d %s %s',
            $minutes,
            Str::plural(trans('canvas::app.min', [], optional($this->user)->locale), $minutes),
            trans('canvas::app.read', [], optional($this->user)->locale)
        );
    }

    /**
     * Get the 10 most popular reading times rounded to the nearest 30 minutes.
     *
     * @param  Post  $post
     * @return array
     */
    protected function calculatePopularReadingTimes(Post $post): array
    {
        // Get the views associated with the post
        $data = $post->views;

        // Filter the view data to only include hours:minutes
        $collection = new Collection();
        $data->each(function ($item, $key) use ($collection) {
            $collection->push($item->created_at->minute(0)->format('H:i'));
        });

        // Count the unique values and assign to their respective keys
        $filtered = array_count_values($collection->toArray());

        $popularReadingTimes = new Collection();
        foreach ($filtered as $key => $value) {
            // Use each given time to create a 60 min range
            $start = Date::createFromTimeString($key);
            $end = $start->copy()->addMinutes(60);

            // Find the percentage based on the value
            $percentage = number_format($value / $data->count() * 100, 2);

            // Get a human-readable hour range and floating percentage
            $popularReadingTimes->put(
                sprintf('%s - %s', $start->format('g:i A'), $end->format('g:i A')),
                $percentage
            );
        }

        // Cast the collection to an array
        $array = $popularReadingTimes->toArray();

        // Only return the top 5 reading times and percentages
        $sliced = array_slice($array, 0, 5, true);

        // Sort the array in a descending order
        arsort($sliced);

        return $sliced;
    }

    /**
     * Get the top referring websites for a post.
     *
     * @param  Post  $post
     * @return array
     */
    protected function calculateTopReferers(Post $post): array
    {
        // Get the views associated with the post
        $data = $post->views;

        // Filter the view data to only include referrers
        $collection = new Collection();
        $data->each(function ($item, $key) use ($collection) {
            if (empty(Canvas::parseReferer($item->referer))) {
                $collection->push(trans('canvas::app.other', [], $this->user->locale));
            } else {
                $collection->push(Canvas::parseReferer($item->referer));
            }
        });

        // Count the unique values and assign to their respective keys
        $array = array_count_values($collection->toArray());

        // Only return the top N referrers with their view count
        $sliced = array_slice($array, 0, 10, true);

        // Sort the array in a descending order
        arsort($sliced);

        return $sliced;
    }
}
