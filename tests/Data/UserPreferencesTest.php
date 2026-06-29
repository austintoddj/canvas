<?php

use Canvas\Data\UserPreferences;
use Canvas\Enums\UserPreference;

it('returns onboarding defaults', function (): void {
    expect(UserPreferences::defaults())->toBe([
        'onboarding' => [
            'complete' => false,
        ],
    ]);
});

it('resolves stored preferences against defaults', function (): void {
    expect(UserPreferences::resolve(null))->toBe(UserPreferences::defaults());

    expect(UserPreferences::resolve([
        'onboarding' => [
            'complete' => true,
        ],
    ]))->toBe([
        'onboarding' => [
            'complete' => true,
        ],
    ]);
});

it('merges incoming preferences without dropping existing values', function (): void {
    $merged = UserPreferences::merge(
        [
            'onboarding' => [
                'complete' => true,
            ],
        ],
        [],
    );

    expect($merged)->toBe([
        'onboarding' => [
            'complete' => true,
        ],
    ]);
});

it('merges partial onboarding updates', function (): void {
    $merged = UserPreferences::merge(
        [
            'onboarding' => [
                'complete' => false,
            ],
        ],
        [
            'onboarding' => [
                'complete' => true,
            ],
        ],
    );

    expect($merged['onboarding']['complete'])->toBeTrue();
});

it('reports onboarding completion through the enum', function (): void {
    $preferences = UserPreferences::resolve([
        'onboarding' => [
            'complete' => true,
        ],
    ]);

    expect(UserPreference::Onboarding->isComplete($preferences))->toBeTrue();
});
