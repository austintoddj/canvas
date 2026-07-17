<?php

use Canvas\Enums\AiProvider;
use Canvas\Enums\SettingKey;
use Canvas\Models\Setting;
use Canvas\Support\Ai;
use Canvas\Support\SettingsRepository;
use Canvas\Support\Unsplash;
use Illuminate\Support\Facades\Crypt;

it('returns unconfigured integrations status for admins', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/settings/integrations')
        ->assertSuccessful()
        ->assertJsonPath('unsplash.configured', false)
        ->assertJsonPath('unsplash.masked_key', null)
        ->assertJsonPath('unsplash.enabled_at', null)
        ->assertJsonPath('ai.configured', false)
        ->assertJsonPath('ai.provider', null)
        ->assertJsonPath('ai.masked_key', null)
        ->assertJsonPath('ai.model', null)
        ->assertJsonPath('ai.enabled_at', null);
});

it('stores an encrypted unsplash access key', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/settings/integrations', [
            'unsplash' => ['access_key' => 'secret-unsplash-key'],
        ])
        ->assertSuccessful()
        ->assertJsonPath('unsplash.configured', true)
        ->assertJsonPath('unsplash.masked_key', SettingsRepository::mask('secret-unsplash-key'))
        ->assertJsonMissing(['secret-unsplash-key']);

    $enabledAt = $response->json('unsplash.enabled_at');

    expect($enabledAt)->toBeString()
        ->and(strtotime((string) $enabledAt))->not->toBeFalse();

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
        ->assertJsonPath('unsplash.masked_key', null)
        ->assertJsonPath('unsplash.enabled_at', null);

    expect(Unsplash::configured())->toBeFalse()
        ->and(Setting::query()->find(SettingKey::UnsplashAccessKey->value))->toBeNull();
});

it('stores an encrypted ai api key and provider', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/settings/integrations', [
            'ai' => [
                'provider' => AiProvider::Xai->value,
                'api_key' => 'secret-xai-key',
                'model' => null,
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('ai.configured', true)
        ->assertJsonPath('ai.provider', 'xai')
        ->assertJsonPath('ai.masked_key', SettingsRepository::mask('secret-xai-key'))
        ->assertJsonPath('ai.model', null)
        ->assertJsonMissing(['secret-xai-key']);

    $enabledAt = $response->json('ai.enabled_at');

    expect($enabledAt)->toBeString()
        ->and(strtotime((string) $enabledAt))->not->toBeFalse();

    $row = Setting::query()->find(SettingKey::AiApiKey->value);

    expect($row)->not->toBeNull()
        ->and($row->value)->not->toBe('secret-xai-key')
        ->and(Crypt::decryptString($row->value))->toBe('secret-xai-key')
        ->and(Ai::configured())->toBeTrue()
        ->and(Ai::provider())->toBe(AiProvider::Xai)
        ->and(Ai::apiKey())->toBe('secret-xai-key')
        ->and(Ai::model())->toBe(AiProvider::Xai->defaultModel());
});

it('strips a bearer prefix and whitespace from ai api keys', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/settings/integrations', [
            'ai' => [
                'provider' => AiProvider::Xai->value,
                'api_key' => '  Bearer xai-secret-key  ',
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('ai.configured', true);

    expect(Ai::apiKey())->toBe('xai-secret-key');
});

it('stores an optional ai model override', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/settings/integrations', [
            'ai' => [
                'provider' => AiProvider::OpenAi->value,
                'api_key' => 'secret-openai-key',
                'model' => 'gpt-4o',
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('ai.configured', true)
        ->assertJsonPath('ai.provider', 'openai')
        ->assertJsonPath('ai.model', 'gpt-4o');

    expect(Ai::model())->toBe('gpt-4o')
        ->and(Ai::modelOverride())->toBe('gpt-4o');
});

it('clears the ai api key when null is sent', function (): void {
    setAiIntegration(AiProvider::Anthropic, 'existing-key', 'claude-sonnet-5');

    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/settings/integrations', [
            'ai' => ['api_key' => null],
        ])
        ->assertSuccessful()
        ->assertJsonPath('ai.configured', false)
        ->assertJsonPath('ai.masked_key', null)
        ->assertJsonPath('ai.enabled_at', null)
        ->assertJsonPath('ai.provider', 'anthropic');

    expect(Ai::configured())->toBeFalse()
        ->and(Ai::apiKey())->toBeNull()
        ->and(Ai::provider())->toBe(AiProvider::Anthropic);
});

it('allows partial updates without requiring both integrations', function (): void {
    setAiIntegration(AiProvider::Xai, 'keep-me');

    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/settings/integrations', [
            'unsplash' => ['access_key' => 'only-unsplash'],
        ])
        ->assertSuccessful()
        ->assertJsonPath('unsplash.configured', true)
        ->assertJsonPath('ai.configured', true)
        ->assertJsonPath('ai.provider', 'xai');

    expect(Ai::apiKey())->toBe('keep-me');
});

it('requires a provider when saving an ai key with none configured', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/settings/integrations', [
            'ai' => ['api_key' => 'no-provider'],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['ai.provider']);
});

it('rejects an empty integrations payload', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/settings/integrations', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['integrations']);
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
