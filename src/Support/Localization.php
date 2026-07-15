<?php

declare(strict_types=1);

namespace Canvas\Support;

final class Localization
{
    /**
     * Selectable BCP-47 language codes with UI labels and translation bases.
     *
     * @var list<array{code: string, label: string, translation: string, rtl: bool}>
     */
    private const CATALOG = [
        ['code' => 'en', 'label' => 'English', 'translation' => 'en', 'rtl' => false],
        ['code' => 'ar-EG', 'label' => 'Arabic (Egypt)', 'translation' => 'ar', 'rtl' => true],
        ['code' => 'ar-SA', 'label' => 'Arabic (Saudi Arabia)', 'translation' => 'ar', 'rtl' => true],
        ['code' => 'ar-AE', 'label' => 'Arabic (United Arab Emirates)', 'translation' => 'ar', 'rtl' => true],
        ['code' => 'bn', 'label' => 'Bengali', 'translation' => 'bn', 'rtl' => false],
        ['code' => 'zh', 'label' => 'Chinese (Simplified)', 'translation' => 'zh', 'rtl' => false],
        ['code' => 'fr', 'label' => 'French', 'translation' => 'fr', 'rtl' => false],
        ['code' => 'de', 'label' => 'German', 'translation' => 'de', 'rtl' => false],
        ['code' => 'hi', 'label' => 'Hindi', 'translation' => 'hi', 'rtl' => false],
        ['code' => 'id', 'label' => 'Indonesian', 'translation' => 'id', 'rtl' => false],
        ['code' => 'it', 'label' => 'Italian', 'translation' => 'it', 'rtl' => false],
        ['code' => 'ja', 'label' => 'Japanese', 'translation' => 'ja', 'rtl' => false],
        ['code' => 'ko', 'label' => 'Korean', 'translation' => 'ko', 'rtl' => false],
        ['code' => 'pt-BR', 'label' => 'Portuguese (Brazil)', 'translation' => 'pt-BR', 'rtl' => false],
        ['code' => 'pt-PT', 'label' => 'Portuguese (Portugal)', 'translation' => 'pt', 'rtl' => false],
        ['code' => 'ru', 'label' => 'Russian', 'translation' => 'ru', 'rtl' => false],
        ['code' => 'es-MX', 'label' => 'Spanish (Mexico)', 'translation' => 'es', 'rtl' => false],
        ['code' => 'es-ES', 'label' => 'Spanish (Spain)', 'translation' => 'es', 'rtl' => false],
        ['code' => 'tr', 'label' => 'Turkish', 'translation' => 'tr', 'rtl' => false],
        ['code' => 'vi', 'label' => 'Vietnamese', 'translation' => 'vi', 'rtl' => false],
    ];

    /**
     * @return list<array{code: string, label: string, translation: string, rtl: bool}>
     */
    public static function catalog(): array
    {
        return self::CATALOG;
    }

    /**
     * @return list<array{code: string, label: string, rtl: bool}>
     */
    public static function languageOptions(): array
    {
        return array_map(
            static fn (array $entry): array => [
                'code' => $entry['code'],
                'label' => $entry['label'],
                'rtl' => $entry['rtl'],
            ],
            self::filteredCatalog(),
        );
    }

    /**
     * @return list<string>
     */
    public static function availableLanguageCodes(): array
    {
        return array_map(
            static fn (array $entry): string => $entry['code'],
            self::filteredCatalog(),
        );
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

        $fallback = (string) config('app.fallback_locale', config('app.locale', 'en'));

        if (self::isSupportedLocale($fallback)) {
            return $fallback;
        }

        return 'en';
    }

    public static function resolveTranslationLocale(?string $locale): string
    {
        $resolved = self::resolveLocale($locale);

        foreach (self::CATALOG as $entry) {
            if ($entry['code'] === $resolved) {
                return $entry['translation'];
            }
        }

        return 'en';
    }

    /**
     * @return array<string, string>
     */
    public static function dictionary(?string $locale): array
    {
        $translationLocale = self::resolveTranslationLocale($locale);
        $fallbackLocale = self::resolveTranslationLocale((string) config('app.fallback_locale', 'en'));

        $fallback = trans('canvas::app', [], $fallbackLocale);
        $primary = trans('canvas::app', [], $translationLocale);

        $merged = array_merge(
            is_array($fallback) ? $fallback : [],
            is_array($primary) ? $primary : [],
        );

        /** @var array<string, string> $dictionary */
        $dictionary = collect($merged)
            ->map(static fn (mixed $value): string => is_scalar($value) ? (string) $value : '')
            ->all();

        return $dictionary;
    }

    public static function availableTranslations(string $locale): string
    {
        return collect(self::dictionary($locale))->toJson();
    }

    public static function isRightToLeftLanguage(?string $locale): bool
    {
        if ($locale === null) {
            return false;
        }

        foreach (self::CATALOG as $entry) {
            if ($entry['code'] === $locale) {
                return $entry['rtl'];
            }
        }

        return false;
    }

    public static function labelFor(?string $locale): ?string
    {
        if ($locale === null) {
            return null;
        }

        foreach (self::CATALOG as $entry) {
            if ($entry['code'] === $locale) {
                return $entry['label'];
            }
        }

        return null;
    }

    /**
     * @return list<string>
     */
    public static function translationBases(): array
    {
        return array_values(array_unique(array_map(
            static fn (array $entry): string => $entry['translation'],
            self::CATALOG,
        )));
    }

    /**
     * @return list<array{code: string, label: string, translation: string, rtl: bool}>
     */
    private static function filteredCatalog(): array
    {
        $configured = config('canvas.locales');

        if (! is_array($configured) || $configured === []) {
            return self::CATALOG;
        }

        /** @var list<string> $allowed */
        $allowed = array_values(array_filter($configured, static fn (mixed $code): bool => is_string($code) && $code !== ''));

        $filtered = array_values(array_filter(
            self::CATALOG,
            static fn (array $entry): bool => in_array($entry['code'], $allowed, true),
        ));

        return $filtered !== [] ? $filtered : self::CATALOG;
    }
}
