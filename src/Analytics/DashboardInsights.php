<?php

declare(strict_types=1);

namespace Canvas\Analytics;

use Canvas\Models\View;
use Canvas\Models\Visit;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use JsonSerializable;

final readonly class DashboardInsights implements JsonSerializable
{
    /**
     * @param  array{views: string, visits: string}  $graph
     */
    private function __construct(
        public int $views,
        public int $visits,
        public array $graph,
    ) {}

    /**
     * @param  Collection<int|string, mixed>  $postIds
     */
    public static function for(Collection $postIds, int $days = 30): self
    {
        if ($postIds->isEmpty()) {
            $emptyGraph = self::dailySeries(collect(), $days)->toJson();

            return new self(
                views: 0,
                visits: 0,
                graph: [
                    'views' => $emptyGraph,
                    'visits' => $emptyGraph,
                ],
            );
        }

        $period = Period::days($days);

        $viewsQuery = View::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('created_at', [$period->start, $period->end]);

        $visitsQuery = Visit::query()
            ->whereIn('post_id', $postIds)
            ->whereBetween('created_at', [$period->start, $period->end]);

        return new self(
            views: (clone $viewsQuery)->count(),
            visits: (clone $visitsQuery)->count(),
            graph: [
                'views' => self::dailySeries(self::dailyAggregates($viewsQuery), $days)->toJson(),
                'visits' => self::dailySeries(self::dailyAggregates($visitsQuery), $days)->toJson(),
            ],
        );
    }

    /**
     * @return array{views: int, visits: int, graph: array{views: string, visits: string}}
     */
    public function jsonSerialize(): array
    {
        return [
            'views' => $this->views,
            'visits' => $this->visits,
            'graph' => $this->graph,
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
}
