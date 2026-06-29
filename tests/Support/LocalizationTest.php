<?php

use Canvas\Support\Localization;
use Illuminate\Support\Facades\File;

it('returns discovered package language codes by default', function (): void {
    $codes = Localization::availableLanguageCodes();

    expect($codes)->toBeArray();
    expect($codes)->toContain('en');
});

it('restricts configured locales to those with translation files', function (): void {
    config()->set('canvas.locales', ['en', 'does-not-exist']);

    expect(Localization::availableLanguageCodes())->toBe(['en']);
});

it('falls back to discovered locales when configuration excludes everything', function (): void {
    config()->set('canvas.locales', ['does-not-exist']);

    expect(Localization::availableLanguageCodes())->toContain('en');
});

it('discovers locales published to lang vendor canvas', function (): void {
    config()->set('canvas.locales', []);

    $publishedLocale = 'zz-published';
    $publishedPath = lang_path('vendor/canvas/'.$publishedLocale);

    File::ensureDirectoryExists($publishedPath);

    try {
        expect(Localization::availableLanguageCodes())->toContain($publishedLocale);
    } finally {
        File::deleteDirectory($publishedPath);
    }
});

it('includes published locales when they are configured explicitly', function (): void {
    $publishedLocale = 'zz-published';
    $publishedPath = lang_path('vendor/canvas/'.$publishedLocale);

    File::ensureDirectoryExists($publishedPath);

    try {
        config()->set('canvas.locales', ['en', $publishedLocale]);

        expect(Localization::availableLanguageCodes())->toBe(['en', $publishedLocale]);
    } finally {
        File::deleteDirectory($publishedPath);
    }
});

it('resolves unsupported locales to the application fallback locale', function (): void {
    config()->set('app.fallback_locale', 'en');

    expect(Localization::resolveLocale('xx'))->toBe('en');
    expect(Localization::resolveLocale(null))->toBe('en');
});

it('resolves supported locales unchanged', function (): void {
    expect(Localization::resolveLocale('en'))->toBe('en');
});

it('returns available translations', function (): void {
    expect(Localization::availableTranslations(config('app.locale')))->toBeString();
});

it('detects right to left languages', function (): void {
    expect(Localization::isRightToLeftLanguage('ar'))->toBeTrue();
    expect(Localization::isRightToLeftLanguage('fa'))->toBeTrue();
    expect(Localization::isRightToLeftLanguage('en'))->toBeFalse();
    expect(Localization::isRightToLeftLanguage(null))->toBeFalse();
});
