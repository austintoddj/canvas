<?php

use Canvas\Enums\AiProvider;
use Canvas\Enums\SettingKey;
use Canvas\Models\Setting;
use Canvas\Support\Ai;
use Canvas\Support\SettingsRepository;
use Canvas\Support\Unsplash;
use Canvas\Support\Webhooks;
use Canvas\Support\WebhookSigner;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;

it('returns unconfigured integrations status for admins', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/integrations')
        ->assertSuccessful()
        ->assertJsonPath('unsplash.configured', false)
        ->assertJsonPath('unsplash.masked_key', null)
        ->assertJsonPath('unsplash.enabled_at', null)
        ->assertJsonPath('ai.configured', false)
        ->assertJsonPath('ai.provider', null)
        ->assertJsonPath('ai.masked_key', null)
        ->assertJsonPath('ai.model', null)
        ->assertJsonPath('ai.enabled_at', null)
        ->assertJsonPath('webhooks.configured', false)
        ->assertJsonPath('webhooks.url', null)
        ->assertJsonPath('webhooks.masked_secret', null)
        ->assertJsonPath('webhooks.events', [])
        ->assertJsonPath('webhooks.enabled_at', null)
        ->assertJsonPath('webhooks.available_events.0.id', 'post.published');
});

it('stores an encrypted unsplash access key', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/integrations', [
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
        ->putJson('canvas/api/integrations', [
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
        ->putJson('canvas/api/integrations', [
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
        ->putJson('canvas/api/integrations', [
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
        ->putJson('canvas/api/integrations', [
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
        ->putJson('canvas/api/integrations', [
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
        ->putJson('canvas/api/integrations', [
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
        ->putJson('canvas/api/integrations', [
            'ai' => ['api_key' => 'no-provider'],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['ai.provider']);
});

it('normalizes blank ai provider and api key strings', function (): void {
    setAiIntegration(AiProvider::Xai, 'existing-key', 'grok-custom');

    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/integrations', [
            'ai' => [
                'provider' => '   ',
                'api_key' => '   ',
                'model' => '   ',
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('ai.provider', null)
        ->assertJsonPath('ai.model', null)
        ->assertJsonPath('ai.configured', false);

    expect(Ai::provider())->toBeNull()
        ->and(Ai::apiKey())->toBeNull()
        ->and(Ai::modelOverride())->toBeNull();
});

it('rejects an empty integrations payload', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/integrations', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['integrations']);
});

it('forbids non-admins from viewing integrations', function (): void {
    $this->actingAs($this->editor, 'canvas')
        ->getJson('canvas/api/integrations')
        ->assertForbidden();
});

it('forbids non-admins from updating integrations', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->putJson('canvas/api/integrations', [
            'unsplash' => ['access_key' => 'nope'],
        ])
        ->assertForbidden();
});

it('requires authentication for integrations', function (): void {
    $this->getJson('canvas/api/integrations')
        ->assertUnauthorized();
});

it('configures webhooks with an auto-generated secret', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/integrations', [
            'webhooks' => [
                'url' => 'https://example.com/hooks/canvas',
                'events' => ['post.published', 'post.deleted'],
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('webhooks.configured', true)
        ->assertJsonPath('webhooks.url', 'https://example.com/hooks/canvas')
        ->assertJsonPath('webhooks.events', ['post.published', 'post.deleted'])
        ->assertJsonStructure(['webhooks' => ['plain_secret', 'masked_secret', 'enabled_at']]);

    $plainSecret = $response->json('webhooks.plain_secret');
    $masked = $response->json('webhooks.masked_secret');

    expect($plainSecret)->toBeString()->toHaveLength(64)
        ->and($masked)->toBe(SettingsRepository::mask($plainSecret))
        ->and($response->json())->not->toHaveKey('webhooks.secret');

    $row = Setting::query()->find(SettingKey::WebhookSecret->value);

    expect($row)->not->toBeNull()
        ->and($row->value)->not->toBe($plainSecret)
        ->and(Crypt::decryptString($row->value))->toBe($plainSecret)
        ->and(Webhooks::configured())->toBeTrue()
        ->and(Webhooks::secret())->toBe($plainSecret);
});

it('rejects private webhook urls', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/integrations', [
            'webhooks' => [
                'url' => 'https://127.0.0.1/hooks',
                'events' => ['post.published'],
            ],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['webhooks.url']);
});

it('requires at least one event when configuring a webhook url', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/integrations', [
            'webhooks' => [
                'url' => 'https://example.com/hooks/canvas',
                'events' => [],
            ],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['webhooks.events']);
});

it('rejects non-subscribable webhook event ids', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/integrations', [
            'webhooks' => [
                'url' => 'https://example.com/hooks/canvas',
                'events' => ['webhook.test'],
            ],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['webhooks.events.0']);
});

it('rotates the webhook signing secret and returns the plain value once', function (): void {
    configureWebhooks(
        url: 'https://example.com/hooks/canvas',
        secret: 'old-secret-value-aaaaaaaa',
        events: ['post.published'],
    );

    $response = $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/integrations', [
            'webhooks' => [
                'rotate_secret' => true,
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('webhooks.configured', true);

    $plainSecret = $response->json('webhooks.plain_secret');

    expect($plainSecret)->toBeString()->not->toBe('old-secret-value-aaaaaaaa')
        ->and(Webhooks::secret())->toBe($plainSecret);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/integrations')
        ->assertSuccessful()
        ->assertJsonMissingPath('webhooks.plain_secret')
        ->assertJsonPath('webhooks.masked_secret', SettingsRepository::mask($plainSecret));
});

it('disconnects webhooks when url is cleared', function (): void {
    configureWebhooks();

    $this->actingAs($this->admin, 'canvas')
        ->putJson('canvas/api/integrations', [
            'webhooks' => [
                'url' => null,
            ],
        ])
        ->assertSuccessful()
        ->assertJsonPath('webhooks.configured', false)
        ->assertJsonPath('webhooks.url', null)
        ->assertJsonPath('webhooks.masked_secret', null)
        ->assertJsonPath('webhooks.events', []);

    expect(Webhooks::configured())->toBeFalse()
        ->and(Setting::query()->find(SettingKey::WebhookUrl->value))->toBeNull()
        ->and(Setting::query()->find(SettingKey::WebhookSecret->value))->toBeNull()
        ->and(Setting::query()->find(SettingKey::WebhookEvents->value))->toBeNull();
});

it('sends an inline signed test webhook when configured', function (): void {
    Http::fake([
        'https://example.com/*' => Http::response(['ok' => true], 200),
    ]);

    configureWebhooks(events: ['post.published']);

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/integrations/webhooks/test')
        ->assertSuccessful()
        ->assertJsonPath('ok', true)
        ->assertJsonPath('event', 'webhook.test');

    expect($response->json('delivery_id'))->toBeString();

    Http::assertSent(function ($request): bool {
        return $request->url() === 'https://example.com/hooks/canvas'
            && ($request->header('Canvas-Event')[0] ?? null) === 'webhook.test'
            && WebhookSigner::verify(
                'whsec_test_secret',
                $request->body(),
                $request->header('Canvas-Signature')[0] ?? '',
                now: time(),
            );
    });
});

it('returns 422 when testing webhooks that are not configured', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/integrations/webhooks/test')
        ->assertStatus(422)
        ->assertJsonPath('code', 'webhooks_not_configured');
});

it('returns 502 when the test webhook endpoint fails', function (): void {
    Http::fake([
        'https://example.com/*' => Http::response('nope', 500),
    ]);

    configureWebhooks();

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/integrations/webhooks/test')
        ->assertStatus(502)
        ->assertJsonPath('code', 'webhooks_test_failed');
});

it('forbids non-admins from testing webhooks', function (): void {
    configureWebhooks();

    $this->actingAs($this->editor, 'canvas')
        ->postJson('canvas/api/integrations/webhooks/test')
        ->assertForbidden();
});
