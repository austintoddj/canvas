<?php

use Canvas\Support\Localization;

it('returns translations for a valid locale', function (): void {
    $locale = Localization::availableLanguageCodes()[0];

    $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/translations/{$locale}")
        ->assertSuccessful()
        ->assertJsonStructure(['assets_are_not_up_to_date', 'min', 'read', 'other', 'nav.dashboard']);
});

it('falls back to app locale for an unsupported locale', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/translations/xx')
        ->assertSuccessful()
        ->assertJsonStructure(['assets_are_not_up_to_date', 'min', 'read', 'other', 'nav.dashboard']);
});

it('returns merged spa keys for regional locales', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/translations/ar-EG')
        ->assertSuccessful()
        ->json();

    expect($response)->toHaveKey('nav.posts')
        ->and($response)->toHaveKey('views');
});
