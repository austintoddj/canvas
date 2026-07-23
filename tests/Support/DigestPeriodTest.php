<?php

use Canvas\Support\DigestPeriod;
use Illuminate\Support\Carbon;

it('builds a seven day period in the requested timezone', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-29 18:00:00', 'America/Chicago'));

    $period = DigestPeriod::forTimezone('America/Chicago');

    expect($period->timezone)->toBe('America/Chicago');
    expect($period->formattedStart())->toBe('Jun 22');
    expect($period->formattedEnd())->toBe('Jun 29');
});

it('falls back to the application timezone when none is provided', function (): void {
    config()->set('app.timezone', 'UTC');

    Carbon::setTestNow('2026-06-29 12:00:00');

    $period = DigestPeriod::forTimezone(null);

    expect($period->timezone)->toBe('UTC');
    expect($period->formattedStart())->toBe('Jun 22');
    expect($period->formattedEnd())->toBe('Jun 29');
});

it('falls back to the application timezone for invalid values', function (): void {
    config()->set('app.timezone', 'UTC');

    Carbon::setTestNow('2026-06-29 12:00:00');

    $period = DigestPeriod::forTimezone('Not/A_Real_Timezone');

    expect($period->timezone)->toBe('UTC');
});

it('exposes utc boundaries for database queries', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-29 00:30:00', 'America/Chicago'));

    $period = DigestPeriod::forTimezone('America/Chicago');

    expect($period->startUtc()->toDateTimeString())->toBe('2026-06-22 05:00:00');
    expect($period->endUtc()->toDateTimeString())->toBe('2026-06-30 04:59:59');
});

it('formats dates with a translation locale when provided', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-29 12:00:00', 'UTC'));

    $period = DigestPeriod::forTimezone('UTC');

    $english = $period->formattedStart('en');
    $spanish = $period->formattedStart('es');

    expect($english)->not->toBeEmpty();
    expect($spanish)->not->toBeEmpty();
    expect($period->formattedEnd('en'))->not->toBeEmpty();
});
