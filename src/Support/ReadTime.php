<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Support\Str;

final class ReadTime
{
    public static function calculate(?string $text, ?string $locale = null): string
    {
        $minutes = (int) ceil(str_word_count(strip_tags((string) $text)) / 250);

        return sprintf(
            '%d %s %s',
            $minutes,
            Str::plural(trans('canvas::app.min', [], $locale), $minutes),
            trans('canvas::app.read', [], $locale)
        );
    }
}
