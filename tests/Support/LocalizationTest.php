<?php

use Canvas\Support\Localization;

it('exposes the curated language catalog', function (): void {
    $codes = Localization::availableLanguageCodes();

    expect($codes)->toHaveCount(20)
        ->and($codes)->toContain('en', 'ar-EG', 'zh', 'pt-BR', 'pt-PT', 'es-MX', 'es-ES', 'ja', 'ko', 'vi', 'bn')
        ->and($codes)->not->toContain('fa', 'bg', 'zh-CN', 'ar', 'es');
});

it('returns language options with labels and rtl flags', function (): void {
    $options = Localization::languageOptions();

    expect($options)->toHaveCount(20);

    $arabic = collect($options)->firstWhere('code', 'ar-SA');
    $english = collect($options)->firstWhere('code', 'en');

    expect($arabic)->toMatchArray([
        'code' => 'ar-SA',
        'label' => 'Arabic (Saudi Arabia)',
        'rtl' => true,
    ])->and($english)->toMatchArray([
        'code' => 'en',
        'label' => 'English',
        'rtl' => false,
    ]);
});

it('restricts configured locales to catalog codes', function (): void {
    config()->set('canvas.locales', ['en', 'does-not-exist', 'ja']);

    expect(Localization::availableLanguageCodes())->toBe(['en', 'ja']);
});

it('falls back to the full catalog when configuration excludes everything', function (): void {
    config()->set('canvas.locales', ['does-not-exist']);

    expect(Localization::availableLanguageCodes())->toHaveCount(20)
        ->and(Localization::availableLanguageCodes())->toContain('en');
});

it('resolves unsupported locales to a catalog fallback', function (): void {
    config()->set('app.fallback_locale', 'en');

    expect(Localization::resolveLocale('xx'))->toBe('en')
        ->and(Localization::resolveLocale(null))->toBe('en')
        ->and(Localization::resolveLocale('zh-CN'))->toBe('en')
        ->and(Localization::resolveLocale('fa'))->toBe('en');
});

it('resolves supported locales unchanged', function (): void {
    expect(Localization::resolveLocale('en'))->toBe('en')
        ->and(Localization::resolveLocale('es-MX'))->toBe('es-MX')
        ->and(Localization::resolveLocale('ar-EG'))->toBe('ar-EG');
});

it('maps regional locales to shared translation bases', function (): void {
    expect(Localization::resolveTranslationLocale('ar-EG'))->toBe('ar')
        ->and(Localization::resolveTranslationLocale('ar-SA'))->toBe('ar')
        ->and(Localization::resolveTranslationLocale('ar-AE'))->toBe('ar')
        ->and(Localization::resolveTranslationLocale('es-MX'))->toBe('es')
        ->and(Localization::resolveTranslationLocale('es-ES'))->toBe('es')
        ->and(Localization::resolveTranslationLocale('pt-BR'))->toBe('pt-BR')
        ->and(Localization::resolveTranslationLocale('pt-PT'))->toBe('pt')
        ->and(Localization::resolveTranslationLocale('zh'))->toBe('zh')
        ->and(Localization::resolveTranslationLocale('en'))->toBe('en');
});

it('returns available translations for a translation base', function (): void {
    $json = Localization::availableTranslations('ar-EG');
    $decoded = json_decode($json, true);

    expect($json)->toBeString()
        ->and($decoded)->toBeArray()
        ->and($decoded)->toHaveKey('views')
        ->and($decoded)->toHaveKey('nav.dashboard');
});

it('returns a full dictionary for every selectable language', function (): void {
    $english = json_decode(Localization::availableTranslations('en'), true);
    $german = json_decode(Localization::availableTranslations('de'), true);
    $arabic = json_decode(Localization::availableTranslations('ar-EG'), true);

    expect($english)->toBeArray()
        ->and($german)->toBeArray()
        ->and($arabic)->toBeArray()
        ->and($english)->toHaveKey('nav.posts')
        ->and($german)->toHaveKey('nav.posts')
        ->and($arabic)->toHaveKey('nav.posts')
        ->and($english['nav.posts'])->toBe('Posts')
        ->and($german['nav.posts'])->not->toBe('')
        ->and($arabic['nav.posts'])->not->toBe('');
});

it('detects right to left languages from the catalog', function (): void {
    expect(Localization::isRightToLeftLanguage('ar-EG'))->toBeTrue()
        ->and(Localization::isRightToLeftLanguage('ar-SA'))->toBeTrue()
        ->and(Localization::isRightToLeftLanguage('ar-AE'))->toBeTrue()
        ->and(Localization::isRightToLeftLanguage('en'))->toBeFalse()
        ->and(Localization::isRightToLeftLanguage('fa'))->toBeFalse()
        ->and(Localization::isRightToLeftLanguage(null))->toBeFalse();
});

it('has a language directory for every translation base', function (): void {
    $langRoot = realpath(__DIR__.'/../../resources/lang');

    expect($langRoot)->not->toBeFalse();

    foreach (Localization::translationBases() as $base) {
        expect(is_dir($langRoot.'/'.$base))
            ->toBeTrue("Missing language directory for translation base [{$base}]");
        expect(is_file($langRoot.'/'.$base.'/app.php'))
            ->toBeTrue("Missing app.php for translation base [{$base}]");
    }
});

it('ships complete translation dictionaries for every base language', function (): void {
    $english = trans('canvas::app', [], 'en');
    expect($english)->toBeArray()->and($english)->not->toBeEmpty();

    foreach (Localization::translationBases() as $base) {
        $locale = trans('canvas::app', [], $base);
        expect($locale)->toBeArray();
        expect(array_keys($locale))->toEqualCanonicalizing(array_keys($english));
    }
});

it('returns labels for catalog codes', function (): void {
    expect(Localization::labelFor('pt-BR'))->toBe('Portuguese (Brazil)')
        ->and(Localization::labelFor('unknown'))->toBeNull()
        ->and(Localization::labelFor(null))->toBeNull();
});
