<?php

use Canvas\Enums\WebhookDeliveryStatus;
use Canvas\Enums\WebhookEvent;
use Canvas\Events\PostDeleted;
use Canvas\Events\PostPublished;
use Canvas\Events\PostUpdated;
use Canvas\Jobs\DeliverWebhookJob;
use Canvas\Models\Post;
use Canvas\Models\WebhookDelivery;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;

it('queues a delivery job when the domain event fires and the event is subscribed', function (): void {
    Bus::fake([DeliverWebhookJob::class]);
    configureWebhooks(events: ['post.published', 'post.updated', 'post.deleted']);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Published post',
        'slug' => 'published-post',
        'published_at' => now()->subHour(),
    ]);

    event(new PostPublished($post));

    Bus::assertDispatched(DeliverWebhookJob::class, function (DeliverWebhookJob $job) use ($post): bool {
        return $job->url === 'https://example.com/hooks/canvas'
            && $job->secret === 'whsec_test_secret'
            && $job->event === WebhookEvent::PostPublished->value
            && ($job->payload['data']['id'] ?? null) === $post->id
            && ($job->payload['api_version'] ?? null) === 1
            && ! array_key_exists('body', $job->payload['data'] ?? []);
    });

    $delivery = WebhookDelivery::query()->where('post_id', $post->id)->first();

    expect($delivery)->not->toBeNull()
        ->and($delivery->status)->toBe(WebhookDeliveryStatus::Pending)
        ->and($delivery->event)->toBe(WebhookEvent::PostPublished->value)
        ->and($delivery->url)->toBe('https://example.com/hooks/canvas')
        ->and(json_encode($delivery->payload))->not->toContain('whsec_test_secret');
});

it('does not queue a job when webhooks are not configured', function (): void {
    Bus::fake([DeliverWebhookJob::class]);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subHour(),
    ]);

    event(new PostPublished($post));

    Bus::assertNotDispatched(DeliverWebhookJob::class);
});

it('does not queue a job when the event is not subscribed', function (): void {
    Bus::fake([DeliverWebhookJob::class]);
    configureWebhooks(events: ['post.deleted']);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subHour(),
    ]);

    event(new PostPublished($post));
    event(new PostUpdated($post));

    Bus::assertNotDispatched(DeliverWebhookJob::class);
});

it('does not queue a job when the endpoint url is not allowed', function (): void {
    Bus::fake([DeliverWebhookJob::class]);
    configureWebhooks(url: 'https://127.0.0.1/hooks');

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'published_at' => now()->subHour(),
    ]);

    event(new PostPublished($post));

    Bus::assertNotDispatched(DeliverWebhookJob::class);
});

it('queues a job for post deleted events', function (): void {
    Bus::fake([DeliverWebhookJob::class]);
    configureWebhooks(events: ['post.deleted']);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
    ]);

    event(new PostDeleted($post));

    Bus::assertDispatched(DeliverWebhookJob::class, fn (DeliverWebhookJob $job): bool => $job->event === 'post.deleted'
        && ($job->payload['data']['id'] ?? null) === $post->id);
});

it('queues a delivery job when a draft is published via the api', function (): void {
    Bus::fake([DeliverWebhookJob::class]);
    configureWebhooks(events: ['post.published']);

    $post = Post::factory()->draft()->create([
        'user_id' => $this->admin->id,
        'title' => 'Go live',
        'slug' => 'go-live',
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/posts/{$post->id}", [
            'title' => 'Go live',
            'slug' => 'go-live',
            'published_at' => now()->subHour()->toIso8601String(),
        ])
        ->assertOk();

    Bus::assertDispatched(DeliverWebhookJob::class, fn (DeliverWebhookJob $job): bool => $job->event === 'post.published'
        && ($job->payload['data']['id'] ?? null) === $post->id
        && ($job->payload['data']['slug'] ?? null) === 'go-live');
});

it('does not queue delivery for pending autosaves on live posts', function (): void {
    Bus::fake([DeliverWebhookJob::class]);
    configureWebhooks(events: ['post.published', 'post.updated']);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Live',
        'slug' => 'live',
        'body' => 'Body',
        'published_at' => now()->subDay(),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/posts/{$post->id}", [
            'title' => 'Pending title',
            'slug' => 'live',
            'body' => 'Pending body',
            'published_at' => $post->published_at->toIso8601String(),
        ])
        ->assertOk()
        ->assertJsonPath('has_pending_changes', true);

    Bus::assertNotDispatched(DeliverWebhookJob::class);
});

it('posts signed http when the queued job is handled', function (): void {
    Http::fake([
        'https://example.com/*' => Http::response(['ok' => true], 200),
    ]);

    $job = new DeliverWebhookJob(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: 'del-sync',
        payload: [
            'api_version' => 1,
            'event' => 'post.published',
            'delivery_id' => 'del-sync',
            'data' => ['id' => 'post-1'],
        ],
    );

    $job->handle();

    Http::assertSent(fn ($request): bool => $request->url() === 'https://example.com/hooks/canvas'
        && ($request->header('Canvas-Event')[0] ?? null) === 'post.published');
});
