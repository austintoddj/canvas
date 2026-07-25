<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Support\Carbon;
use InvalidArgumentException;

/**
 * Absolute publish/schedule instants for the HTTP API.
 *
 * Wire format is ISO-8601 with a timezone designator (offset or Z).
 * Storage is a naive datetime in config('app.timezone') for comparison with now().
 */
final class PublishedAt
{
    /**
     * True when the string ends with Z or a numeric UTC offset.
     */
    public static function hasTimezone(string $value): bool
    {
        return (bool) preg_match('/(?:Z|[+-]\d{2}:?\d{2})$/i', trim($value));
    }

    /**
     * Parse an absolute instant and convert it into the application timezone.
     *
     * @throws InvalidArgumentException When the value is empty, naive, or unparseable.
     */
    public static function parse(string $value): Carbon
    {
        $trimmed = trim($value);

        if ($trimmed === '') {
            throw new InvalidArgumentException('published_at must not be empty.');
        }

        if (! self::hasTimezone($trimmed)) {
            throw new InvalidArgumentException('published_at must include a timezone offset or Z.');
        }

        return Carbon::parse($trimmed)->timezone((string) config('app.timezone'));
    }

    /**
     * App-timezone wall clock for the dateTime column.
     */
    public static function toStorageString(Carbon $at): string
    {
        return $at->copy()->timezone((string) config('app.timezone'))->format('Y-m-d H:i:s');
    }
}
