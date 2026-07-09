<?php

declare(strict_types=1);

namespace Canvas\Support;

final class Localization
{
    /**
     * @return list<string>
     */
    public static function availableLanguageCodes(): array
    {
        $discovered = self::discoveredLanguageCodes();
        $configured = config('canvas.locales');

        if (! is_array($configured) || $configured === []) {
            return $discovered;
        }

        /** @var list<string> $filtered */
        $filtered = array_values(array_intersect($discovered, $configured));

        return $filtered !== [] ? $filtered : $discovered;
    }

    public static function isSupportedLocale(?string $locale): bool
    {
        return $locale !== null
            && in_array($locale, self::availableLanguageCodes(), true);
    }

    public static function resolveLocale(?string $locale): string
    {
        if (self::isSupportedLocale($locale)) {
            return $locale;
        }

        return (string) config('app.fallback_locale', config('app.locale'));
    }

    public static function availableTranslations(string $locale): string
    {
        return collect(trans('canvas::app', [], self::resolveLocale($locale)))->toJson();
    }

    public static function isRightToLeftLanguage(?string $locale): bool
    {
        return in_array($locale, ['ar', 'fa'], true);
    }

    /**
     * @return list<string>
     */
    private static function discoveredLanguageCodes(): array
    {
        $paths = array_filter([
            realpath(__DIR__.'/../../resources/lang') ?: null,
            function_exists('lang_path') ? lang_path('vendor/canvas') : null,
            function_exists('resource_path') ? resource_path('lang/vendor/canvas') : null,
        ]);

        return collect($paths)
            ->flatMap(static function (string $path): array {
                return glob($path.'/*', GLOB_ONLYDIR) ?: [];
            })
            ->map(static fn (string $path): string => basename($path))
            ->unique()
            ->sort()
            ->values()
            ->all();
    }
}
