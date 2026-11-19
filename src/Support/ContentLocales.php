<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

final class ContentLocales
{
    public static function enabled(): bool
    {
        return (bool) config('canvas.content.enabled', false);
    }

    public static function default(): string
    {
        return config('canvas.content.default_locale') ?: config('app.locale', 'en');
    }

    /** @return list<string> */
    public static function all(): array
    {
        $locales = config('canvas.content.locales') ?: [self::default()];
        if (! is_array($locales) || ! in_array(self::default(), $locales, true)) {
            throw new InvalidArgumentException('The default Canvas content locale must be supported.');
        }
        foreach ($locales as $locale) {
            if (! is_string($locale) || ! preg_match('/^[a-zA-Z]{2,8}(?:[-_][a-zA-Z0-9]{2,8})*$/D', $locale) || strlen($locale) > 85) {
                throw new InvalidArgumentException('Invalid Canvas content locale.');
            }
        }

        return array_values(array_unique($locales));
    }

    public static function resolve(?string $locale = null): string
    {
        $locale ??= app()->getLocale();

        return in_array($locale, self::all(), true) ? $locale : self::default();
    }

    public static function requested(): string
    {
        $locale = request()->input('locale', self::default());
        if (! is_string($locale) || ! in_array($locale, self::all(), true)) {
            throw ValidationException::withMessages(['locale' => trans('validation.in', ['attribute' => 'locale'])]);
        }

        return $locale;
    }
}
