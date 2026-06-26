<?php

use Canvas\Support\Localization;

it('returns available language codes', function (): void {
    expect(Localization::availableLanguageCodes())->toBeArray();
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
