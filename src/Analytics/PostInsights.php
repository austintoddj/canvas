<?php

declare(strict_types=1);

namespace Canvas\Analytics;

use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Canvas\Support\ReadTime;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Date;
use JsonSerializable;

final readonly class PostInsights implements JsonSerializable
{
    /**
     * @param  array<string, string>  $popularReadingTimes
     * @param  array<string, int>  $topReferers
     * @param  array<string, int>  $topBrowsers
     * @param  array{direction: string, percentage: string}  $monthOverMonthViews
     * @param  array{direction: string, percentage: string}  $monthOverMonthVisits
     * @param  array{views: string, visits: string}  $graph
     */
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
        $graphPeriod = Period::days(30);

        $currentViewsQuery = $post->views()
            ->whereBetween('created_at', [$current->start, $current->end]);

        $currentVisitsQuery = $post->visits()
            ->whereBetween('created_at', [$current->start, $current->end]);

        $monthlyViews = (clone $currentViewsQuery)->count();
        $monthlyVisits = (clone $currentVisitsQuery)->count();

        $previousViewsCount = $post->views()
            ->whereBetween('created_at', [$previous->start, $previous->end])
            ->count();

        $previousVisitsCount = $post->visits()
            ->whereBetween('created_at', [$previous->start, $previous->end])
            ->count();

        $graphViewsQuery = $post->views()
            ->whereBetween('created_at', [$graphPeriod->start, $graphPeriod->end]);

        $graphVisitsQuery = $post->visits()
            ->whereBetween('created_at', [$graphPeriod->start, $graphPeriod->end]);

        return new self(
            post: $post,
            readTime: ReadTime::calculate($post->body, $locale),
            popularReadingTimes: self::popularReadingTimes(clone $currentViewsQuery),
            topReferers: self::topReferers(clone $currentViewsQuery, $locale),
            topBrowsers: self::topBrowsers(clone $currentViewsQuery, $locale),
            monthlyViews: $monthlyViews,
            totalViews: $post->views()->count(),
            monthlyVisits: $monthlyVisits,
            monthOverMonthViews: self::monthOverMonth($monthlyViews, $previousViewsCount),
            monthOverMonthVisits: self::monthOverMonth($monthlyVisits, $previousVisitsCount),
            graph: [
                'views' => self::dailySeries(self::dailyAggregates(clone $graphViewsQuery), 30)->toJson(),
                'visits' => self::dailySeries(self::dailyAggregates(clone $graphVisitsQuery), 30)->toJson(),
            ],
        );
    }

    /**
     * @return array{
     *     post: Post,
     *     readTime: string,
     *     popularReadingTimes: array<string, string>,
     *     topReferers: array<string, int>,
     *     topBrowsers: array<string, int>,
     *     monthlyViews: int,
     *     totalViews: int,
     *     monthlyVisits: int,
     *     monthOverMonthViews: array{direction: string, percentage: string},
     *     monthOverMonthVisits: array{direction: string, percentage: string},
     *     graph: array{views: string, visits: string}
     * }
     */
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

    /**
     * @param  Builder<View>|Builder<Visit>|HasMany<View, Post>|HasMany<Visit, Post>  $query
     * @return Collection<string, int>
     */
    private static function dailyAggregates(Builder|HasMany $query): Collection
    {
        $day = QueryDate::dayExpression();

        /** @var Collection<string, int> $counts */
        $counts = $query
            ->toBase()
            ->selectRaw("{$day} as day, COUNT(*) as aggregate")
            ->groupByRaw($day)
            ->pluck('aggregate', 'day')
            ->map(fn (mixed $count): int => (int) $count);

        return $counts;
    }

    /**
     * @param  Collection<string, int>  $counts
     * @return Collection<string, int>
     */
    private static function dailySeries(Collection $counts, int $days): Collection
    {
        /** @var Collection<string, int> $result */
        $result = new Collection;

        foreach (CarbonPeriod::create(today()->subDays($days), today()) as $date) {
            /** @var CarbonInterface $date */
            $key = $date->format('Y-m-d');
            $result[$key] = $counts->get($key, 0);
        }

        return $result;
    }

    /**
     * @return array{direction: string, percentage: string}
     */
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

    /**
     * @param  Builder<View>|HasMany<View, Post>  $views
     * @return array<string, string>
     */
    private static function popularReadingTimes(Builder|HasMany $views): array
    {
        $hour = QueryDate::hourExpression();

        $rows = $views
            ->toBase()
            ->selectRaw("{$hour} as hour, COUNT(*) as aggregate")
            ->groupByRaw($hour)
            ->orderByDesc('aggregate')
            ->get();

        $total = (int) $rows->sum('aggregate');

        if ($total === 0) {
            return [];
        }

        $results = [];

        foreach ($rows->take(5) as $row) {
            $start = Date::createFromTimeString((string) $row->hour);
            $end = $start->copy()->addMinutes(60);
            $label = sprintf('%s - %s', $start->format('g:i A'), $end->format('g:i A'));
            $results[$label] = number_format(((int) $row->aggregate) / $total * 100, 2);
        }

        return $results;
    }

    /**
     * @param  Builder<View>|HasMany<View, Post>  $views
     * @return array<string, int>
     */
    private static function topReferers(Builder|HasMany $views, ?string $locale): array
    {
        $other = trans('canvas::app.other', [], $locale);

        $rows = $views
            ->toBase()
            ->selectRaw('referer, COUNT(*) as aggregate')
            ->groupBy('referer')
            ->orderByDesc('aggregate')
            ->limit(10)
            ->get();

        $results = [];

        foreach ($rows as $row) {
            $key = filled($row->referer) ? (string) $row->referer : $other;
            $results[$key] = ($results[$key] ?? 0) + (int) $row->aggregate;
        }

        arsort($results);

        return array_slice($results, 0, 10, true);
    }

    /**
     * @param  Builder<View>|HasMany<View, Post>  $views
     * @return array<string, int>
     */
    private static function topBrowsers(Builder|HasMany $views, ?string $locale): array
    {
        $agents = $views->pluck('agent');

        /** @var array<string, int> $results */
        $results = $agents
            ->countBy(fn (?string $agent): string => self::parseBrowser($agent, $locale))
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
