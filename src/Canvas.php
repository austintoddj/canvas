<?php

declare(strict_types=1);

namespace Canvas;

use Canvas\Models\Post;
use Carbon\CarbonInterval;
use DateInterval;
use DatePeriod;
use DateTimeInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;

class Canvas
{
    /**
     * Return the installed version.
     *
     * @return string
     */
    public static function installedVersion()
    {
        if (app()->runningUnitTests()) {
            return '';
        }

        $dependencies = json_decode(file_get_contents(base_path('composer.lock')), true)['packages'];

        return collect($dependencies)->firstWhere('name', 'austintoddj/canvas')['version'];
    }

    /**
     * Return a list of available language codes.
     *
     * @return array
     */
    public static function availableLanguageCodes()
    {
        $locales = preg_grep('/^([^.])/', scandir(dirname(__DIR__).'/lang'));

        return collect($locales)->each(function ($code) {
            return $code;
        })->toArray();
    }

    /**
     * Return an encoded string of app translations.
     *
     * @param $locale
     * @return string
     */
    public static function availableTranslations($locale)
    {
        return collect(trans('canvas::app', [], $locale))->toJson();
    }

    /**
     * Return true if the publishable assets are up-to-date.
     *
     * @return bool
     */
    public static function assetsUpToDate()
    {
        if (app()->runningUnitTests()) {
            return true;
        }

        $path = public_path('vendor/canvas/mix-manifest.json');

        if (! File::exists($path)) {
            throw new RuntimeException(vsprintf('%s%s. %s', [
                trans('canvas::app.assets_are_not_up_to_date'),
                trans('canvas::app.to_update_run'),
                'php artisan canvas:publish',
            ]));
        }

        return File::get($path) === File::get(dirname(__DIR__).'/public/mix-manifest.json');
    }

    /**
     * Return the configured base path url.
     *
     * @return string
     */
    public static function basePath()
    {
        return sprintf('/%s', config('canvas.path'));
    }

    /**
     * Return the configured storage path url.
     *
     * @return string
     */
    public static function baseStoragePath()
    {
        return sprintf('%s/images', config('canvas.storage_path'));
    }

    /**
     * Return a valid host URL or null.
     *
     * @param  string|null  $url
     * @return string|null
     */
    public static function parseReferer(?string $url)
    {
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            return parse_url($url)['host'];
        }

        return null;
    }

    /**
     * Generate a Gravatar for a given email.
     *
     * @param  string  $email
     * @param  int  $size
     * @param  string  $default
     * @param  string  $rating
     * @return string
     */
    public static function gravatar(
        string $email,
        int $size = 200,
        string $default = 'retro',
        string $rating = 'g'
    ) {
        $hash = md5(trim(Str::lower($email)));

        return "https://secure.gravatar.com/avatar/{$hash}?s={$size}&d={$default}&r={$rating}";
    }

    /**
     * Return true if dark mode is enabled.
     *
     * @param  int|null  $enabled
     * @return bool
     */
    public static function enabledDarkMode(?int $enabled)
    {
        return (bool) $enabled;
    }

    /**
     * Return true if the app is configured to use Arabic or Farsi.
     *
     * @param  string|null  $locale
     * @return bool
     */
    public static function usingRightToLeftLanguage(?string $locale)
    {
        // TODO: Can this just be accessed in the controller?

        return in_array($locale, ['ar', 'fa']);
    }

    /**
     * Given a collection of Views or Visits, return an array of formatted
     * date strings and their related counts for a given number of days.
     *
     * example: [ Y-m-d => total ]
     *
     * @param  \Illuminate\Support\Collection  $data
     * @param  int  $days
     * @return \Illuminate\Support\Collection
     */
    public static function calculateTotalForDays(Collection $data, int $days = 30)
    {
        // Filter the data to only include created_at date strings
        $filtered = new Collection();

        $data->sortBy('created_at')->each(function ($item) use ($filtered) {
            $filtered->push($item->created_at->toDateString());
        });

        // Count the unique values and assign to their respective keys
        $unique = array_count_values($filtered->toArray());

        // Create a day range to hold the default date values
        $period = self::generateDateRange(today()->subDays($days), CarbonInterval::day(), $days);

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
     * @param  \Illuminate\Support\Collection  $current
     * @param  Collection  $previous
     * @return array
     */
    public static function compareMonthOverMonth(Collection $current, Collection $previous)
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
    public static function generateDateRange(
        DateTimeInterface $start_date,
        DateInterval $interval,
        int $recurrences,
        int $exclusive = 1
    ) {
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
    public static function calculateReadTime(?string $text)
    {
        // Only count words in our estimation
        $words = str_word_count(strip_tags($text ?? ''));

        // Divide by the average number of words per minute
        $minutes = ceil($words / 250);

        // The user is optional since we append this attribute
        // to every model and we may be creating a new one
        return sprintf('%d %s %s',
            $minutes,
            Str::plural(trans('canvas::app.min', [], optional(request()->user)->locale), $minutes),
            trans('canvas::app.read', [], optional(request()->user)->locale)
        );
    }

    /**
     * Get the 10 most popular reading times rounded to the nearest 30 minutes.
     *
     * @param  \Canvas\Models\Post  $post
     * @return array
     */
    public static function calculatePopularReadingTimes(Post $post)
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
     * @param  \Canvas\Models\Post  $post
     * @return array
     */
    public static function calculateTopReferers(Post $post)
    {
        // Get the views associated with the post
        $data = $post->views;

        // Filter the view data to only include referrers
        $collection = new Collection();
        $data->each(function ($item, $key) use ($collection) {
            if (empty(self::parseReferer($item->referer))) {
                $collection->push(trans('canvas::app.other', [], request()->user('canvas')->locale));
            } else {
                $collection->push(self::parseReferer($item->referer));
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
