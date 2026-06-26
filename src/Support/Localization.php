<?php

declare(strict_types=1);

namespace Canvas\Support;

final class Localization
{
    public static function availableLanguageCodes(): array
    {
        return collect(glob(__DIR__.'/../../resources/lang/*', GLOB_ONLYDIR) ?: [])
            ->map(static fn (string $path): string => basename($path))
            ->values()
            ->all();
    }

    public static function availableTranslations(string $locale): string
    {
        return collect(trans('canvas::app', [], $locale))->toJson();
    }

    public static function isRightToLeftLanguage(?string $locale): bool
    {
        return in_array($locale, ['ar', 'fa'], true);
    }
}
