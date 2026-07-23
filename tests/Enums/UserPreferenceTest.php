<?php

use Canvas\Enums\UserPreference;

it('uses onboarding as the preference key', function (): void {
    expect(UserPreference::Onboarding->value)->toBe('onboarding');
});

it('reports completion from nested preference data', function (): void {
    expect(UserPreference::Onboarding->isComplete([
        'onboarding' => ['complete' => true],
    ]))->toBeTrue();

    expect(UserPreference::Onboarding->isComplete([
        'onboarding' => ['complete' => false],
    ]))->toBeFalse();
});

it('defaults incomplete when the key is missing', function (): void {
    expect(UserPreference::Onboarding->isComplete([]))->toBeFalse();
    expect(UserPreference::Onboarding->isComplete([
        'onboarding' => [],
    ]))->toBeFalse();
});
