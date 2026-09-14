<?php

use Canvas\Enums\WebhookDeliveryStatus;
use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;
use Canvas\Jobs\DeliverWebhookJob;
use Canvas\Models\Post;
use Canvas\Models\WebhookDelivery;
use Canvas\Support\PostLifecycleEvents;
use Canvas\Support\PostSnapshot;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Event;

beforeEach(function (): void {
    Carbon::setTestNow('2026-07-31 12:00:00');
});

afterEach(function (): void {
    Carbon::setTestNow();
});

it('dispatches PostPublished once when a scheduled post becomes live by time', function (): void {
    Event::fake([PostPublished::class, PostScheduled::class, PostUpdated::class, PostUnpublished::class]);

    $post = Post::factory()->create([
        'published_at' => now()->subMinute(),
        'published_notified_at' => null,
        'title' => 'Due now',
        'slug' => 'due-now',
    ]);

    $this->artisan('canvas:announce-scheduled')->assertSuccessful();

    Event::assertDispatchedTimes(PostPublished::class, 1);
    Event::assertDispatched(PostPublished::class, fn (PostPublished $event): bool => $event->post->id === $post->id);
    Event::assertNotDispatched(PostScheduled::class);
    Event::assertNotDispatched(PostUpdated::class);
    Event::assertNotDispatched(PostUnpublished::class);

    expect($post->refresh()->published_notified_at)->not->toBeNull();
});

it('does not dispatch again on a subsequent run', function (): void {
    Event::fake([PostPublished::class]);

    $post = Post::factory()->create([
        'published_at' => now()->subMinute(),
        'published_notified_at' => null,
    ]);

    $this->artisan('canvas:announce-scheduled')->assertSuccessful();
    $this->artisan('canvas:announce-scheduled')->assertSuccessful();

    Event::assertDispatchedTimes(PostPublished::class, 1);
    expect($post->refresh()->published_notified_at)->not->toBeNull();
});

it('ignores drafts', function (): void {
    Event::fake([PostPublished::class]);

    Post::factory()->draft()->create([
        'published_notified_at' => null,
    ]);

    $this->artisan('canvas:announce-scheduled')->assertSuccessful();

    Event::assertNotDispatched(PostPublished::class);
});

it('ignores still-scheduled posts', function (): void {
    Event::fake([PostPublished::class]);

    Post::factory()->scheduled()->create([
        'published_notified_at' => null,
    ]);

    $this->artisan('canvas:announce-scheduled')->assertSuccessful();

    Event::assertNotDispatched(PostPublished::class);
});

it('ignores live posts that were already announced', function (): void {
    Event::fake([PostPublished::class]);

    Post::factory()->create([
        'published_at' => now()->subDay(),
        'published_notified_at' => now()->subDay(),
    ]);

    $this->artisan('canvas:announce-scheduled')->assertSuccessful();

    Event::assertNotDispatched(PostPublished::class);
});

it('announces when published_at is exactly now', function (): void {
    Event::fake([PostPublished::class]);

    $post = Post::factory()->create([
        'published_at' => now(),
        'published_notified_at' => null,
    ]);

    $this->artisan('canvas:announce-scheduled')->assertSuccessful();

    Event::assertDispatchedTimes(PostPublished::class, 1);
    Event::assertDispatched(PostPublished::class, fn (PostPublished $event): bool => $event->post->id === $post->id);
});

it('does not re-announce after a human publish already set the marker', function (): void {
    Event::fake([PostPublished::class]);

    $post = Post::factory()->create([
        'published_at' => now()->subMinute(),
        'published_notified_at' => null,
    ]);

    // Mimic the controller path: lifecycle dispatch for live write sets the marker.
    PostLifecycleEvents::dispatch(null, $post);

    expect($post->refresh()->published_notified_at)->not->toBeNull();

    Event::fake([PostPublished::class]);

    $this->artisan('canvas:announce-scheduled')->assertSuccessful();

    Event::assertNotDispatched(PostPublished::class);
});

it('does not set the marker on a live update that is not PostPublished', function (): void {
    Event::fake([PostPublished::class, PostUpdated::class]);

    $post = Post::factory()->create([
        'title' => 'Live',
        'slug' => 'live',
        'published_at' => now()->subDay(),
        'published_notified_at' => null,
    ]);

    $before = PostSnapshot::from($post);
    $post->forceFill(['title' => 'Live edited'])->save();
    PostLifecycleEvents::dispatch($before, $post->refresh());

    Event::assertDispatched(PostUpdated::class);
    Event::assertNotDispatched(PostPublished::class);
    expect($post->refresh()->published_notified_at)->toBeNull();

    $this->artisan('canvas:announce-scheduled')->assertSuccessful();

    Event::assertDispatchedTimes(PostPublished::class, 1);
    expect($post->refresh()->published_notified_at)->not->toBeNull();
});

it('still announces after a pending autosave once the schedule has elapsed', function (): void {
    Event::fake([PostPublished::class, PostScheduled::class, PostUpdated::class, PostUnpublished::class]);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Soon',
        'slug' => 'soon-autosave',
        'body' => 'Original',
        'published_at' => now()->addMinutes(5),
        'published_notified_at' => null,
    ]);

    $this->travel(10)->minutes();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/posts/{$post->id}", [
            'title' => 'Soon edited',
            'slug' => 'soon-autosave',
            'body' => 'Pending body',
            'published_at' => $post->published_at?->toIso8601String(),
        ])
        ->assertOk()
        ->assertJsonPath('has_pending_changes', true);

    Event::assertNothingDispatched();
    expect($post->refresh()->published_notified_at)->toBeNull();

    $this->artisan('canvas:announce-scheduled')->assertSuccessful();

    Event::assertDispatchedTimes(PostPublished::class, 1);
    expect($post->refresh()->published_notified_at)->not->toBeNull();
});

it('queues a webhook delivery when announcing a scheduled post that went live', function (): void {
    Bus::fake([DeliverWebhookJob::class]);
    configureWebhooks(events: ['post.published']);

    $post = Post::factory()->create([
        'published_at' => now()->subMinute(),
        'published_notified_at' => null,
    ]);

    $this->artisan('canvas:announce-scheduled')->assertSuccessful();

    Bus::assertDispatched(DeliverWebhookJob::class, function (DeliverWebhookJob $job) use ($post): bool {
        return $job->event === 'post.published'
            && ($job->payload['data']['id'] ?? null) === $post->id;
    });

    $delivery = WebhookDelivery::query()->where('post_id', $post->id)->first();

    expect($delivery)->not->toBeNull()
        ->and($delivery->status)->toBe(WebhookDeliveryStatus::Pending)
        ->and($delivery->event)->toBe('post.published');
});

it('continues announcing remaining posts when one announce fails', function (): void {
    $bad = Post::factory()->create([
        'slug' => 'announce-boom',
        'published_at' => now()->subMinute(),
        'published_notified_at' => null,
    ]);
    $good = Post::factory()->create([
        'slug' => 'announce-ok',
        'published_at' => now()->subMinute(),
        'published_notified_at' => null,
    ]);

    Event::listen(PostPublished::class, function (PostPublished $event): void {
        if ($event->post->slug === 'announce-boom') {
            throw new RuntimeException('announce failed');
        }
    });

    $this->artisan('canvas:announce-scheduled')
        ->expectsOutputToContain('announce failed')
        ->assertFailed();

    expect($bad->refresh()->published_notified_at)->toBeNull()
        ->and($good->refresh()->published_notified_at)->not->toBeNull();
});
