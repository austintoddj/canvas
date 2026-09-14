<?php

use Canvas\Enums\IntegrationStatus;
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
        ->and(Webhooks::status())->toBe(IntegrationStatus::Enabled)
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

it('treats invalid event json as no subscriptions', function (): void {
    app(SettingsRepository::class)->set(SettingKey::WebhookEvents, '{not-json');

    expect(Webhooks::events())->toBe([])
        ->and(Webhooks::eventValues())->toBe([])
        ->and(Webhooks::configured())->toBeFalse();
});

it('treats credentials without an enabled handshake as off', function (): void {
    $settings = app(SettingsRepository::class);
    $settings->set(SettingKey::WebhookUrl, 'https://example.com/hooks/canvas');
    $settings->set(SettingKey::WebhookSecret, 'whsec_test_secret');
    $settings->set(SettingKey::WebhookEvents, json_encode(['post.published'], JSON_THROW_ON_ERROR));

    expect(Webhooks::hasCredentials())->toBeTrue()
        ->and(Webhooks::status())->toBe(IntegrationStatus::Off)
        ->and(Webhooks::pending())->toBeTrue()
        ->and(Webhooks::configured())->toBeFalse();
});

it('is pending when credentials exist without an enabled handshake', function (): void {
    configureWebhooks();
    markWebhooksPending();

    expect(Webhooks::hasCredentials())->toBeTrue()
        ->and(Webhooks::pending())->toBeTrue()
        ->and(Webhooks::configured())->toBeFalse()
        ->and(Webhooks::status())->toBe(IntegrationStatus::Off);
});

it('treats a leftover pending status row as off', function (): void {
    configureWebhooks();
    app(SettingsRepository::class)->set(SettingKey::WebhookStatus, 'pending');
    app(SettingsRepository::class)->forget(SettingKey::WebhookVerifiedAt);

    expect(Webhooks::status())->toBe(IntegrationStatus::Off)
        ->and(Webhooks::pending())->toBeTrue()
        ->and(Webhooks::configured())->toBeFalse();
});

it('skips non-string values inside the events list', function (): void {
    app(SettingsRepository::class)->set(
        SettingKey::WebhookEvents,
        json_encode(['post.published', 42, null, true, 'post.updated'], JSON_THROW_ON_ERROR),
    );

    expect(Webhooks::eventValues())->toBe(['post.published', 'post.updated']);
});
