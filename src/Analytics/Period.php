<?php

declare(strict_types=1);

namespace Canvas\Analytics;

use Carbon\CarbonInterface;

final readonly class Period
{
    public function __construct(
        public CarbonInterface $start,
        public CarbonInterface $end,
    ) {}

    public static function days(int $days): self
    {
        return new self(
            today()->subDays($days)->startOfDay(),
            today()->endOfDay(),
        );
    }

    /**
     * The window of equal length immediately before {@see days()}.
     */
    public static function previousDays(int $days): self
    {
        return new self(
            today()->subDays($days * 2)->startOfDay(),
            today()->subDays($days + 1)->endOfDay(),
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
