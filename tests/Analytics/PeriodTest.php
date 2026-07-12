<?php

use Canvas\Analytics\Period;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Date;

beforeEach(function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-15 12:00:00', 'UTC'));
});

afterEach(function (): void {
    Carbon::setTestNow();
    Date::useDefault();
});

it('builds a rolling day window ending today', function (): void {
    $period = Period::days(30);

    expect($period->start->toDateTimeString())->toBe('2026-05-16 00:00:00')
        ->and($period->end->toDateTimeString())->toBe('2026-06-15 23:59:59');
});

it('accepts CarbonImmutable bounds from the date factory', function (): void {
    Date::use(CarbonImmutable::class);
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-15 12:00:00', 'UTC'));

    $period = Period::days(7);

    expect($period->start)->toBeInstanceOf(CarbonImmutable::class)
        ->and($period->start->toDateTimeString())->toBe('2026-06-08 00:00:00')
        ->and($period->end->toDateTimeString())->toBe('2026-06-15 23:59:59');

    CarbonImmutable::setTestNow();
});

it('builds the current calendar month', function (): void {
    $period = Period::currentMonth();

    expect($period->start->toDateTimeString())->toBe('2026-06-01 00:00:00')
        ->and($period->end->toDateTimeString())->toBe('2026-06-30 23:59:59');
});

it('builds the previous calendar month without overflow', function (): void {
    Carbon::setTestNow(Carbon::parse('2026-03-31 12:00:00', 'UTC'));

    $period = Period::previousMonth();

    expect($period->start->toDateTimeString())->toBe('2026-02-01 00:00:00')
        ->and($period->end->toDateTimeString())->toBe('2026-02-28 23:59:59');
});
