<?php

use Canvas\Support\PublishedAt;
use Illuminate\Support\Carbon;

it('requires a timezone designator', function (): void {
    expect(PublishedAt::hasTimezone('2026-07-25T16:00:00Z'))->toBeTrue()
        ->and(PublishedAt::hasTimezone('2026-07-25T11:00:00-05:00'))->toBeTrue()
        ->and(PublishedAt::hasTimezone('2026-07-25T11:00:00+0000'))->toBeTrue()
        ->and(PublishedAt::hasTimezone('2026-07-25 16:00:00'))->toBeFalse()
        ->and(PublishedAt::hasTimezone('2026-07-25'))->toBeFalse();
});

it('parses absolute instants into the application timezone', function (): void {
    config(['app.timezone' => 'UTC']);

    $at = PublishedAt::parse('2026-07-25T11:00:00-05:00');

    expect($at->format('Y-m-d H:i:s'))->toBe('2026-07-25 16:00:00')
        ->and($at->timezoneName)->toBe('UTC');
});

it('rejects naive strings when parsing', function (): void {
    PublishedAt::parse('2026-07-25 16:00:00');
})->throws(InvalidArgumentException::class);

it('formats storage strings in the application timezone', function (): void {
    config(['app.timezone' => 'UTC']);

    $at = Carbon::parse('2026-07-25T11:00:00-05:00');

    expect(PublishedAt::toStorageString($at))->toBe('2026-07-25 16:00:00');
});
