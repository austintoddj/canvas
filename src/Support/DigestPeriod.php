<?php

declare(strict_types=1);

namespace Canvas\Support;

use Carbon\CarbonInterface;
use Carbon\Exceptions\InvalidTimeZoneException;
use Illuminate\Support\Carbon;

final readonly class DigestPeriod
{
    public function __construct(
        public CarbonInterface $start,
        public CarbonInterface $end,
        public string $timezone,
    ) {}

    public static function forTimezone(?string $timezone): self
    {
        $timezone = self::resolveTimezone($timezone);
        $end = Carbon::now($timezone)->endOfDay();
        $start = Carbon::now($timezone)->subDays(7)->startOfDay();

        return new self($start, $end, $timezone);
    }

    public function startUtc(): CarbonInterface
    {
        return $this->start->copy()->utc();
    }

    public function endUtc(): CarbonInterface
    {
        return $this->end->copy()->utc();
    }

    public function formattedStart(?string $locale = null): string
    {
        return $this->formatDate($this->start, $locale);
    }

    public function formattedEnd(?string $locale = null): string
    {
        return $this->formatDate($this->end, $locale);
    }

    private function formatDate(CarbonInterface $date, ?string $locale): string
    {
        $carbon = Carbon::instance($date->copy());

        if (filled($locale)) {
            $carbon->locale(Localization::resolveTranslationLocale($locale));
        }

        return $carbon->translatedFormat('M j');
    }

    private static function resolveTimezone(?string $timezone): string
    {
        $fallback = (string) config('app.timezone');

        if (! filled($timezone)) {
            return $fallback;
        }

        try {
            Carbon::now($timezone);

            return $timezone;
        } catch (InvalidTimeZoneException) {
            return $fallback;
        }
    }
}
