<?php

declare(strict_types=1);

namespace Canvas\Analytics;

use Carbon\Carbon;

final readonly class Period
{
    public function __construct(
        public Carbon $start,
        public Carbon $end,
    ) {}

    public static function days(int $days): self
    {
        return new self(
            today()->subDays($days)->startOfDay(),
            today()->endOfDay(),
        );
    }

    public static function currentMonth(): self
    {
        return new self(
            today()->startOfMonth()->startOfDay(),
            today()->endOfMonth()->endOfDay(),
        );
    }

    public static function previousMonth(): self
    {
        return new self(
            today()->subMonthNoOverflow()->startOfMonth()->startOfDay(),
            today()->subMonthNoOverflow()->endOfMonth()->endOfDay(),
        );
    }
}
