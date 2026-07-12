<?php

use Canvas\Enums\SettingKey;
use Canvas\Models\Setting;
use Canvas\Support\SettingsRepository;
use Illuminate\Support\Facades\Crypt;

it('stores and retrieves a secret setting encrypted', function (): void {
    $repository = app(SettingsRepository::class);

    $repository->set(SettingKey::UnsplashAccessKey, 'my-secret');

    expect($repository->get(SettingKey::UnsplashAccessKey))->toBe('my-secret')
        ->and($repository->has(SettingKey::UnsplashAccessKey))->toBeTrue();

    $stored = Setting::query()->find(SettingKey::UnsplashAccessKey->value)?->value;

    expect($stored)->not->toBe('my-secret')
        ->and(Crypt::decryptString((string) $stored))->toBe('my-secret');
});

it('forgets a setting', function (): void {
    $repository = app(SettingsRepository::class);

    $repository->set(SettingKey::UnsplashAccessKey, 'temp');
    $repository->forget(SettingKey::UnsplashAccessKey);

    expect($repository->get(SettingKey::UnsplashAccessKey))->toBeNull()
        ->and($repository->has(SettingKey::UnsplashAccessKey))->toBeFalse();
});

it('treats empty values as forget', function (): void {
    $repository = app(SettingsRepository::class);

    $repository->set(SettingKey::UnsplashAccessKey, 'temp');
    $repository->set(SettingKey::UnsplashAccessKey, '  ');

    expect($repository->get(SettingKey::UnsplashAccessKey))->toBeNull();
});

it('masks secrets for display', function (): void {
    expect(SettingsRepository::mask(null))->toBeNull()
        ->and(SettingsRepository::mask(''))->toBeNull()
        ->and(SettingsRepository::mask('ab'))->toBe('••')
        ->and(SettingsRepository::mask('secret-key-1234'))->toEndWith('1234')
        ->and(SettingsRepository::mask('secret-key-1234'))->toStartWith('•');
});
