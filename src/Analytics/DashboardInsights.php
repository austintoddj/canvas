<?php

declare(strict_types=1);

namespace Canvas\Analytics;

use Canvas\Models\View;
use Canvas\Models\Visit;
use Canvas\Support\Localization;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use JsonSerializable;

final readonly class DashboardInsights implements JsonSerializable
{
    /**
     * @param  array{views: string, visits: string}  $graph
     * @param  array{direction: string, percentage: string}  $monthOverMonthViews
     * @param  array{direction: string, percentage: string}  $monthOverMonthVisits
     * @param  array<string, int>  $topReferers
     */
    private function __construct(
        public int $views,
        public int $visits,
        public array $graph,
        public array $monthOverMonthViews,
        public array $monthOverMonthVisits,
        public array $topReferers,
    ) {}

    /**
     * @param  Collection<int|string, mixed>  $postIds
     */
    public static function for(Collection $postIds, int $days = 30, ?string $locale = null): self
    {
        $emptyChange = self::monthOverMonth(0, 0);

        if ($postIds->isEmpty()) {
            $emptyGraph = self::dailySeries(collect(), $days)->toJson();

            return new self(
                views: 0,
                visits: 0,
                graph: [
                    'views' => $emptyGraph,
                    'visits' => $emptyGraph,
                ],
                monthOverMonthViews: $emptyChange,
                monthOverMonthVisits: $emptyChange,
                topReferers: [],
            );
        }

        $period = Period::days($days);
        $previous = Period::previousDays($days);

        $viewsQuery = View::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('created_at', [$period->start, $period->end]);

        $visitsQuery = Visit::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('created_at', [$period->start, $period->end]);

        $views = (clone $viewsQuery)->count();
        $visits = (clone $visitsQuery)->count();

        $previousViews = View::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('created_at', [$previous->start, $previous->end])
            ->count();

        $previousVisits = Visit::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('created_at', [$previous->start, $previous->end])
            ->count();

        return new self(
            views: $views,
            visits: $visits,
            graph: [
                'views' => self::dailySeries(self::dailyAggregates($viewsQuery), $days)->toJson(),
                'visits' => self::dailySeries(self::dailyAggregates($visitsQuery), $days)->toJson(),
            ],
            monthOverMonthViews: self::monthOverMonth($views, $previousViews),
            monthOverMonthVisits: self::monthOverMonth($visits, $previousVisits),
            topReferers: self::topReferers(clone $viewsQuery, $locale),
        );
    }

    /**
     * @return array{
     *     views: int,
     *     visits: int,
     *     graph: array{views: string, visits: string},
     *     monthOverMonthViews: array{direction: string, percentage: string},
     *     monthOverMonthVisits: array{direction: string, percentage: string},
     *     topReferers: array<string, int>
     * }
     */
    public function jsonSerialize(): array
    {
        return [
            'views' => $this->views,
            'visits' => $this->visits,
            'graph' => $this->graph,
            'monthOverMonthViews' => $this->monthOverMonthViews,
            'monthOverMonthVisits' => $this->monthOverMonthVisits,
            'topReferers' => $this->topReferers,
        ];
    }

    /**
     * @param  Builder<*>  $query
     * @return Collection<string, int>
     */
    private static function dailyAggregates(Builder $query): Collection
    {
        $day = QueryDate::dayExpression();

        /** @var Collection<string, int> $counts */
        $counts = (clone $query)
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
    private static function monthOverMonth(int $current, int $previous): array
    {
        $growth = $previous !== 0
            ? (($current - $previous) / $previous) * 100
            : $current * 100;

        return [
            'direction' => $current > $previous ? 'up' : 'down',
            'percentage' => number_format(abs($growth)),
        ];
    }

    /**
     * @param  Builder<View>  $views
     * @return array<string, int>
     */
    private static function topReferers(Builder $views, ?string $locale): array
    {
        $other = trans('canvas::app.other', [], Localization::resolveTranslationLocale($locale));

        $rows = $views
            ->toBase()
            ->selectRaw('referer, COUNT(*) as aggregate')
            ->groupBy('referer')
            ->orderByDesc('aggregate')
            ->limit(50)
            ->get();

        $results = [];

        foreach ($rows as $row) {
            $key = filled($row->referer) ? (string) $row->referer : $other;
            $results[$key] = ($results[$key] ?? 0) + (int) $row->aggregate;
        }

        arsort($results);

        return array_slice($results, 0, 50, true);
    }
}
