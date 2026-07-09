<?php

use Canvas\Analytics\Period;
use Illuminate\Support\Carbon;

beforeEach(function (): void {
    Carbon::setTestNow(Carbon::parse('2026-06-15 12:00:00', 'UTC'));
});

afterEach(function (): void {
    Carbon::setTestNow();
});

it('builds a rolling day window ending today', function (): void {
    $period = Period::days(30);

    expect($period->start->toDateTimeString())->toBe('2026-05-16 00:00:00')
        ->and($period->end->toDateTimeString())->toBe('2026-06-15 23:59:59');
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
