<?php

use Canvas\Enums\WebhookEvent;
use Canvas\Support\SettingsWebhookEndpointRepository;

it('returns a single endpoint when webhooks are configured for the event', function (): void {
    configureWebhooks(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        events: ['post.published'],
    );

    $endpoints = app(SettingsWebhookEndpointRepository::class)
        ->enabledFor(WebhookEvent::PostPublished);

    expect($endpoints)->toHaveCount(1)
        ->and($endpoints[0]->url)->toBe('https://example.com/hooks/canvas')
        ->and($endpoints[0]->secret)->toBe('whsec_test_secret');
});

it('returns no endpoints when the event is not subscribed', function (): void {
    configureWebhooks(events: ['post.published']);

    expect(app(SettingsWebhookEndpointRepository::class)->enabledFor(WebhookEvent::PostDeleted))
        ->toBe([]);
});

it('returns no endpoints when the stored url is not public https', function (): void {
    configureWebhooks(url: 'https://127.0.0.1/hooks', events: ['post.published']);

    expect(app(SettingsWebhookEndpointRepository::class)->enabledFor(WebhookEvent::PostPublished))
        ->toBe([]);
});
