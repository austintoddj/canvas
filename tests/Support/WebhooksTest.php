<?php

use Canvas\Enums\SettingKey;
use Canvas\Enums\WebhookEvent;
use Canvas\Support\SettingsRepository;
use Canvas\Support\Webhooks;

it('is not configured until url secret and events are present', function (): void {
    expect(Webhooks::configured())->toBeFalse();

    app(SettingsRepository::class)->set(SettingKey::WebhookUrl, 'https://example.com/hook');
    expect(Webhooks::configured())->toBeFalse();

    app(SettingsRepository::class)->set(SettingKey::WebhookSecret, 'secret');
    expect(Webhooks::configured())->toBeFalse();

    configureWebhooks(events: ['post.published', 'post.deleted']);
    expect(Webhooks::configured())->toBeTrue()
        ->and(Webhooks::url())->toBe('https://example.com/hooks/canvas')
        ->and(Webhooks::secret())->toBe('whsec_test_secret')
        ->and(Webhooks::eventValues())->toBe(['post.published', 'post.deleted']);
});

it('ignores unknown and non-subscribable event ids', function (): void {
    configureWebhooks(events: ['post.published', 'webhook.test', 'not.real', 'post.updated']);

    expect(Webhooks::eventValues())->toBe(['post.published', 'post.updated'])
        ->and(Webhooks::subscribesTo(WebhookEvent::PostPublished))->toBeTrue()
        ->and(Webhooks::subscribesTo(WebhookEvent::PostDeleted))->toBeFalse()
        ->and(Webhooks::subscribesTo(WebhookEvent::WebhookTest))->toBeFalse();
});
