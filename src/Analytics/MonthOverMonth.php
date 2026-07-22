<?php

declare(strict_types=1);

namespace Canvas\Analytics;

final class MonthOverMonth
{
    /**
     * @return array{direction: string, percentage: string, comparable: bool}
     */
    public static function compare(int $current, int $previous): array
    {
        if ($previous === 0) {
            return [
                'direction' => $current > 0 ? 'up' : 'down',
                'percentage' => '0',
                'comparable' => false,
            ];
        }

        $growth = (($current - $previous) / $previous) * 100;

        return [
            'direction' => $current > $previous ? 'up' : 'down',
            'percentage' => number_format(abs($growth)),
            'comparable' => true,
        ];
    }
}
