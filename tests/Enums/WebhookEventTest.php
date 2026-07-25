<?php

use Canvas\Enums\WebhookEvent;
use Canvas\Events\PostDeleted;
use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;
use Canvas\Models\Post;
use Illuminate\Support\Str;

it('uses stable string ids for the public catalog', function (): void {
    expect(WebhookEvent::PostPublished->value)->toBe('post.published')
        ->and(WebhookEvent::PostScheduled->value)->toBe('post.scheduled')
        ->and(WebhookEvent::PostUpdated->value)->toBe('post.updated')
        ->and(WebhookEvent::PostUnpublished->value)->toBe('post.unpublished')
        ->and(WebhookEvent::PostDeleted->value)->toBe('post.deleted')
        ->and(WebhookEvent::WebhookTest->value)->toBe('webhook.test');
});

it('excludes the test event from subscriptions', function (): void {
    expect(WebhookEvent::WebhookTest->isSubscribable())->toBeFalse()
        ->and(WebhookEvent::PostPublished->isSubscribable())->toBeTrue();

    expect(WebhookEvent::subscribableValues())
        ->toBe([
            'post.published',
            'post.scheduled',
            'post.updated',
            'post.unpublished',
            'post.deleted',
        ])
        ->not->toContain('webhook.test');
});

it('exposes admin option rows for subscribable events', function (): void {
    $options = WebhookEvent::subscribableOptions();

    expect($options)->toHaveCount(5)
        ->and($options[0])->toMatchArray([
            'id' => 'post.published',
            'label' => 'Published',
            'description' => 'When a draft or scheduled post goes live.',
        ])
        ->and($options[1])->toMatchArray([
            'id' => 'post.scheduled',
            'label' => 'Scheduled',
            'description' => 'When a future publish date is set on a post.',
        ]);
});

it('lists every case value including the test ping', function (): void {
    expect(WebhookEvent::values())->toContain('webhook.test')
        ->and(WebhookEvent::values())->toHaveCount(6);
});

it('maps domain events to catalog ids', function (): void {
    $post = Post::factory()->make(['id' => (string) Str::uuid()]);

    expect(WebhookEvent::fromDomainEvent(new PostPublished($post)))->toBe(WebhookEvent::PostPublished)
        ->and(WebhookEvent::fromDomainEvent(new PostScheduled($post)))->toBe(WebhookEvent::PostScheduled)
        ->and(WebhookEvent::fromDomainEvent(new PostUpdated($post)))->toBe(WebhookEvent::PostUpdated)
        ->and(WebhookEvent::fromDomainEvent(new PostUnpublished($post)))->toBe(WebhookEvent::PostUnpublished)
        ->and(WebhookEvent::fromDomainEvent(new PostDeleted($post)))->toBe(WebhookEvent::PostDeleted)
        ->and(WebhookEvent::fromDomainEvent(new stdClass))->toBeNull();
});
