<?php

use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;
use Canvas\Models\Post;
use Canvas\Support\PostLifecycleEvents;
use Illuminate\Support\Carbon;
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
