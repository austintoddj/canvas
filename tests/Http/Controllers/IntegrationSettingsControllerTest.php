<?php

use Canvas\Enums\SettingKey;
use Canvas\Models\Setting;
use Canvas\Support\SettingsRepository;
use Canvas\Support\Unsplash;
use Illuminate\Support\Facades\Crypt;

it('returns unconfigured integrations status for admins', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/settings/integrations')
        ->assertSuccessful()
        ->assertJsonPath('unsplash.configured', false)
        ->assertJsonPath('unsplash.masked_key', null);
});

it('stores an encrypted unsplash access key', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/settings/integrations', [
            'unsplash' => ['access_key' => 'secret-unsplash-key'],
        ])
        ->assertSuccessful()
        ->assertJsonPath('unsplash.configured', true)
        ->assertJsonPath('unsplash.masked_key', SettingsRepository::mask('secret-unsplash-key'))
        ->assertJsonMissing(['secret-unsplash-key']);

    $row = Setting::query()->find(SettingKey::UnsplashAccessKey->value);

    expect($row)->not->toBeNull()
        ->and($row->value)->not->toBe('secret-unsplash-key')
        ->and(Crypt::decryptString($row->value))->toBe('secret-unsplash-key')
        ->and(Unsplash::configured())->toBeTrue()
        ->and(Unsplash::accessKey())->toBe('secret-unsplash-key');
});

it('clears the unsplash access key when null is sent', function (): void {
    setUnsplashAccessKey('existing-key');

    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/settings/integrations', [
            'unsplash' => ['access_key' => null],
        ])
        ->assertSuccessful()
        ->assertJsonPath('unsplash.configured', false)
        ->assertJsonPath('unsplash.masked_key', null);

    expect(Unsplash::configured())->toBeFalse()
        ->and(Setting::query()->find(SettingKey::UnsplashAccessKey->value))->toBeNull();
});

it('forbids non-admins from viewing integrations', function (): void {
    $this->actingAs($this->editor, 'canvas')
        ->getJson('canvas/api/settings/integrations')
        ->assertForbidden();
});

it('forbids non-admins from updating integrations', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->putJson('canvas/api/settings/integrations', [
            'unsplash' => ['access_key' => 'nope'],
        ])
        ->assertForbidden();
});

it('requires authentication for integrations', function (): void {
    $this->getJson('canvas/api/settings/integrations')
        ->assertUnauthorized();
});
