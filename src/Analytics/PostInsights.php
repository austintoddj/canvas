<?php

declare(strict_types=1);

namespace Canvas\Analytics;

use Canvas\Models\Post;
use Canvas\Support\ReadTime;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Date;
use JsonSerializable;

final readonly class PostInsights implements JsonSerializable
{
    private function __construct(
        public Post $post,
        public string $readTime,
        public array $popularReadingTimes,
        public array $topReferers,
        public array $topBrowsers,
        public int $monthlyViews,
        public int $totalViews,
        public int $monthlyVisits,
        public array $monthOverMonthViews,
        public array $monthOverMonthVisits,
        public array $graph,
    ) {}

    public static function for(Post $post, ?string $locale = null): self
    {
        $current = Period::currentMonth();
        $previous = Period::previousMonth();

        $currentViews = $post->views()
            ->whereBetween('created_at', [$current->start, $current->end])
            ->get(['created_at', 'referer', 'agent']);

        $currentVisits = $post->visits()
            ->whereBetween('created_at', [$current->start, $current->end])
            ->get(['created_at']);

        $previousViewsCount = $post->views()
            ->whereBetween('created_at', [$previous->start, $previous->end])
            ->count();

        $previousVisitsCount = $post->visits()
            ->whereBetween('created_at', [$previous->start, $previous->end])
            ->count();

        return new self(
            post: $post,
            readTime: ReadTime::calculate($post->body, $locale),
            popularReadingTimes: self::popularReadingTimes($currentViews),
            topReferers: self::topReferers($currentViews, $locale),
            topBrowsers: self::topBrowsers($currentViews, $locale),
            monthlyViews: $currentViews->count(),
            totalViews: $post->views()->count(),
            monthlyVisits: $currentVisits->count(),
            monthOverMonthViews: self::monthOverMonth($currentViews->count(), $previousViewsCount),
            monthOverMonthVisits: self::monthOverMonth($currentVisits->count(), $previousVisitsCount),
            graph: [
                'views' => self::dailyCounts($currentViews, 30)->toJson(),
                'visits' => self::dailyCounts($currentVisits, 30)->toJson(),
            ],
        );
    }

    public function jsonSerialize(): array
    {
        return [
            'post' => $this->post,
            'readTime' => $this->readTime,
            'popularReadingTimes' => $this->popularReadingTimes,
            'topReferers' => $this->topReferers,
            'topBrowsers' => $this->topBrowsers,
            'monthlyViews' => $this->monthlyViews,
            'totalViews' => $this->totalViews,
            'monthlyVisits' => $this->monthlyVisits,
            'monthOverMonthViews' => $this->monthOverMonthViews,
            'monthOverMonthVisits' => $this->monthOverMonthVisits,
            'graph' => $this->graph,
        ];
    }

    private static function dailyCounts(Collection $data, int $days): Collection
    {
        $counts = $data->countBy(fn ($item) => $item->created_at->toDateString());

        return collect(CarbonPeriod::create(today()->subDays($days), today()))
            ->mapWithKeys(fn ($date) => [$date->format('Y-m-d') => $counts->get($date->format('Y-m-d'), 0)]);
    }

    private static function monthOverMonth(int $thisMonth, int $lastMonth): array
    {
        $growth = $lastMonth !== 0
            ? (($thisMonth - $lastMonth) / $lastMonth) * 100
            : $thisMonth * 100;

        return [
            'direction' => $thisMonth > $lastMonth ? 'up' : 'down',
            'percentage' => number_format(abs($growth)),
        ];
    }

    private static function popularReadingTimes(Collection $views): array
    {
        $total = $views->count();

        if ($total === 0) {
            return [];
        }

        $results = [];

        foreach ($views->countBy(fn ($item) => $item->created_at->minute(0)->format('H:i')) as $time => $count) {
            $start = Date::createFromTimeString($time);
            $end = $start->copy()->addMinutes(60);
            $results[sprintf('%s - %s', $start->format('g:i A'), $end->format('g:i A'))] = number_format($count / $total * 100, 2);
        }

        arsort($results);

        return array_slice($results, 0, 5, true);
    }

    private static function topReferers(Collection $views, ?string $locale): array
    {
        $other = trans('canvas::app.other', [], $locale);

        $results = $views
            ->countBy(fn ($item) => $item->referer ?: $other)
            ->all();

        arsort($results);

        return array_slice($results, 0, 10, true);
    }

    private static function topBrowsers(Collection $views, ?string $locale): array
    {
        $results = $views
            ->countBy(fn ($item) => self::parseBrowser($item->agent, $locale))
            ->all();

        arsort($results);

        return array_slice($results, 0, 5, true);
    }

    private static function parseBrowser(?string $agent, ?string $locale): string
    {
        if (! $agent) {
            return trans('canvas::app.other', [], $locale);
        }

        $lower = strtolower($agent);

        return match (true) {
            str_contains($lower, 'edg') => 'Edge',
            str_contains($lower, 'chrome') => 'Chrome',
            str_contains($lower, 'firefox') => 'Firefox',
            str_contains($lower, 'safari') => 'Safari',
            str_contains($lower, 'opr') || str_contains($lower, 'opera') => 'Opera',
            default => trans('canvas::app.other', [], $locale),
        };
    }
}
