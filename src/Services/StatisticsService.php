<?php

declare(strict_types=1);

namespace Canvas\Services;

use Carbon\CarbonInterval;
use Carbon\CarbonPeriod;

class StatisticsService
{
    public function getViewsForRange(): array
    {
        CarbonInterval::hours(24);
        $data = CarbonPeriod::createFromArray([
            now()->startOfDay(),
            now()->endOfDay(),
        ]);
//        $data = CarbonPeriod::createFromArray([
//            request()->query('from'),
//            request()->query('to')
//        ]);

//        dd(CarbonPeriod::createFromArray([
//            request()->query('from'),
//            request()->query('to'),
//        ]));

        $data = $this->rangeLookups(request()->query('from'), request()->query('to'));

        return [
            'count' => 0,
            'change' => 0,
        ];
    }
}
