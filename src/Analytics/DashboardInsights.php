<?php

declare(strict_types=1);

namespace Canvas\Analytics;

use Canvas\Models\View;
use Canvas\Models\Visit;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use JsonSerializable;

final readonly class DashboardInsights implements JsonSerializable
{
    private function __construct(
        public int $views,
        public int $visits,
        public array $graph,
    ) {}

    public static function for(Collection $postIds, int $days = 30): self
    {
        $period = Period::days($days);

        $views = View::query()
            ->select('created_at')
            ->whereIn('post_id', $postIds)
            ->whereBetween('created_at', [$period->start, $period->end])
            ->get();

        $visits = Visit::query()
            ->select('created_at')
            ->whereIn('post_id', $postIds)
            ->whereBetween('created_at', [$period->start, $period->end])
            ->get();

        return new self(
            views: $views->count(),
            visits: $visits->count(),
            graph: [
                'views' => self::dailyCounts($views, $days)->toJson(),
                'visits' => self::dailyCounts($visits, $days)->toJson(),
            ],
        );
    }

    public function jsonSerialize(): array
    {
        return [
            'views' => $this->views,
            'visits' => $this->visits,
            'graph' => $this->graph,
        ];
    }

    private static function dailyCounts(Collection $data, int $days): Collection
    {
        $counts = $data->countBy(fn ($item) => $item->created_at->toDateString());

        return collect(CarbonPeriod::create(today()->subDays($days), today()))
            ->mapWithKeys(fn ($date) => [$date->format('Y-m-d') => $counts->get($date->format('Y-m-d'), 0)]);
    }
}
