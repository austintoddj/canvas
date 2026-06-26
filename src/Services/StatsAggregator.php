<?php

namespace Canvas\Services;

use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Str;

class StatsAggregator
{
    /**
     * The authenticated user instance.
     */
    protected object $user;

    /**
     * Create a new service instance.
     */
    public function __construct(object $user)
    {
        $this->user = $user;
    }

    /**
     * Get monthly insights on a given set of posts.
     */
    public function getStatsForPosts(Collection $posts, int $days = 30): array
    {
        $postIds = $posts->pluck('id');
        $range = [
            today()->subDays($days)->startOfDay()->toDateTimeString(),
            today()->endOfDay()->toDateTimeString(),
        ];

        $views = View::query()
            ->select('created_at')
            ->whereIn('post_id', $postIds)
            ->whereBetween('created_at', $range)
            ->get();

        $visits = Visit::query()
            ->select('created_at')
            ->whereIn('post_id', $postIds)
            ->whereBetween('created_at', $range)
            ->get();

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
            'topBrowsers' => $this->calculateTopBrowsers($post),
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
     * Given a collection of Views or Visits, return a keyed collection of
     * date strings to counts for a given number of days: [ Y-m-d => total ]
     */
    protected function calculateTotalForDays(Collection $data, int $days = 30): Collection
    {
        $counts = $data->countBy(fn ($item) => $item->created_at->toDateString());

        return collect(CarbonPeriod::create(today()->subDays($days), today()))
            ->mapWithKeys(fn ($date) => [$date->format('Y-m-d') => $counts->get($date->format('Y-m-d'), 0)]);
    }

    /**
     * Given two collections of monthly data, compare the totals and return the
     * overall directional trend as well as the percentage increase/decrease.
     */
    protected function compareMonthOverMonth(Collection $current, Collection $previous): array
    {
        $thisMonth = $current->count();
        $lastMonth = $previous->count();

        if ($lastMonth !== 0) {
            $growth = (($thisMonth - $lastMonth) / $lastMonth) * 100;
        } else {
            $growth = $thisMonth * 100;
        }

        return [
            'direction' => $thisMonth > $lastMonth ? 'up' : 'down',
            'percentage' => number_format(abs($growth)),
        ];
    }

    /**
     * Get the human-friendly estimated reading time of a given text.
     */
    protected function calculateReadTime(?string $text): string
    {
        $minutes = (int) ceil(str_word_count(strip_tags((string) $text)) / 250);

        return sprintf(
            '%d %s %s',
            $minutes,
            Str::plural(trans('canvas::app.min', [], optional($this->user)->locale), $minutes),
            trans('canvas::app.read', [], optional($this->user)->locale)
        );
    }

    /**
     * Get the top 5 most popular reading times as hour ranges with percentages.
     */
    protected function calculatePopularReadingTimes(Post $post): array
    {
        $data = $post->views;
        $total = $data->count();

        if ($total === 0) {
            return [];
        }

        $results = [];

        foreach ($data->countBy(fn ($item) => $item->created_at->minute(0)->format('H:i')) as $time => $count) {
            $start = Date::createFromTimeString($time);
            $end = $start->copy()->addMinutes(60);
            $results[sprintf('%s - %s', $start->format('g:i A'), $end->format('g:i A'))] = number_format($count / $total * 100, 2);
        }

        arsort($results);

        return array_slice($results, 0, 5, true);
    }

    /**
     * Get the top 10 referring websites for a post.
     *
     * The referer stored in canvas_views is already a processed hostname
     * (e.g. "google.com"), so no further URL parsing is needed here.
     */
    protected function calculateTopReferers(Post $post): array
    {
        $other = trans('canvas::app.other', [], $this->user->locale);

        $results = $post->views
            ->countBy(fn ($item) => $item->referer ?: $other)
            ->all();

        arsort($results);

        return array_slice($results, 0, 10, true);
    }

    /**
     * Get the top 5 browsers used to view a post, derived from stored user-agent strings.
     */
    protected function calculateTopBrowsers(Post $post): array
    {
        $results = $post->views
            ->countBy(fn ($item) => $this->parseBrowser($item->agent))
            ->all();

        arsort($results);

        return array_slice($results, 0, 5, true);
    }

    /**
     * Map a user-agent string to a friendly browser name.
     */
    private function parseBrowser(?string $agent): string
    {
        if (! $agent) {
            return trans('canvas::app.other', [], $this->user->locale);
        }

        $lower = strtolower($agent);

        return match (true) {
            str_contains($lower, 'edg') => 'Edge',
            str_contains($lower, 'chrome') => 'Chrome',
            str_contains($lower, 'firefox') => 'Firefox',
            str_contains($lower, 'safari') => 'Safari',
            str_contains($lower, 'opr') || str_contains($lower, 'opera') => 'Opera',
            default => trans('canvas::app.other', [], $this->user->locale),
        };
    }
}
