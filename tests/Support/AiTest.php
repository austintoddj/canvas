<?php

use Canvas\Enums\AiProvider;
use Canvas\Enums\SettingKey;
use Canvas\Support\Ai;
use Canvas\Support\SettingsRepository;

it('reports unconfigured when no provider or key is set', function (): void {
    expect(Ai::configured())->toBeFalse()
        ->and(Ai::provider())->toBeNull()
        ->and(Ai::apiKey())->toBeNull()
        ->and(Ai::model())->toBeNull()
        ->and(Ai::modelOverride())->toBeNull();
});

it('returns null for model when provider is unset even if a model override exists', function (): void {
    app(SettingsRepository::class)->set(SettingKey::AiModel, 'orphaned-model');

    expect(Ai::provider())->toBeNull()
        ->and(Ai::model())->toBeNull()
        ->and(Ai::modelOverride())->toBe('orphaned-model');
});

it('ignores invalid stored provider values', function (): void {
    app(SettingsRepository::class)->set(SettingKey::AiProvider, 'not-a-provider');
    app(SettingsRepository::class)->set(SettingKey::AiApiKey, 'some-key');

    expect(Ai::provider())->toBeNull()
        ->and(Ai::configured())->toBeFalse()
        ->and(Ai::model())->toBeNull();
});

it('falls back to the provider default model when no override is stored', function (): void {
    setAiIntegration(AiProvider::Anthropic, 'anthropic-key');

    expect(Ai::configured())->toBeTrue()
        ->and(Ai::model())->toBe(AiProvider::Anthropic->defaultModel())
        ->and(Ai::modelOverride())->toBeNull();
});
