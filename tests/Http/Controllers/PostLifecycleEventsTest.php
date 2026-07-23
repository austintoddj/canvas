<?php

use Canvas\Events\PostDeleted;
use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;
use Canvas\Models\Post;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

/**
 * WP1: domain events fire only on public snapshot mutations (not pending autosave).
 */
describe('post lifecycle domain events', function (): void {
    it('does not dispatch events when autosaving pending changes on a live post', function (): void {
        Event::fake([
            PostPublished::class,
            PostScheduled::class,
            PostUpdated::class,
            PostUnpublished::class,
            PostDeleted::class,
        ]);

        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'body' => 'Live body',
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Edited Title',
                'slug' => 'edited-slug',
                'body' => 'Edited body',
                'published_at' => $post->published_at->format('Y-m-d H:i:s'),
            ])
            ->assertOk()
            ->assertJsonPath('has_pending_changes', true);

        Event::assertNothingDispatched();
    });

    it('does not dispatch events when discarding pending changes', function (): void {
        Event::fake([
            PostPublished::class,
            PostScheduled::class,
            PostUpdated::class,
            PostUnpublished::class,
            PostDeleted::class,
        ]);

        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'published_at' => now()->subDay(),
            'pending' => [
                'title' => 'Pending Title',
                'slug' => 'pending-slug',
                'summary' => null,
                'body' => 'Pending body',
                'featured_image' => null,
                'featured_image_caption' => null,
                'meta' => null,
                'tags' => [],
                'topic' => null,
            ],
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}/discard")
            ->assertOk();

        Event::assertNothingDispatched();
    });

    it('does not dispatch events when saving draft-only edits', function (): void {
        Event::fake([
            PostPublished::class,
            PostScheduled::class,
            PostUpdated::class,
            PostUnpublished::class,
            PostDeleted::class,
        ]);

        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Draft',
            'slug' => 'draft',
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Still a draft',
                'slug' => 'still-a-draft',
                'published_at' => null,
            ])
            ->assertOk();

        Event::assertNothingDispatched();
    });

    it('dispatches PostPublished when a draft becomes live', function (): void {
        Event::fake([PostPublished::class, PostScheduled::class, PostUpdated::class, PostUnpublished::class]);

        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Ready',
            'slug' => 'ready',
        ]);

        $publishedAt = now()->subHour()->format('Y-m-d H:i:s');

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Ready',
                'slug' => 'ready',
                'published_at' => $publishedAt,
            ])
            ->assertOk();

        Event::assertDispatched(PostPublished::class, fn (PostPublished $event): bool => $event->post->id === $post->id);
        Event::assertNotDispatched(PostScheduled::class);
        Event::assertNotDispatched(PostUpdated::class);
        Event::assertNotDispatched(PostUnpublished::class);
    });

    it('dispatches PostPublished when creating a new post that is immediately live', function (): void {
        Event::fake([PostPublished::class, PostScheduled::class, PostUpdated::class]);

        $id = (string) Str::uuid();
        $publishedAt = now()->subHour()->format('Y-m-d H:i:s');

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$id}", [
                'title' => 'Brand new live',
                'slug' => 'brand-new-live',
                'published_at' => $publishedAt,
            ])
            ->assertCreated();

        Event::assertDispatched(PostPublished::class, fn (PostPublished $event): bool => $event->post->id === $id);
        Event::assertNotDispatched(PostScheduled::class);
        Event::assertNotDispatched(PostUpdated::class);
    });

    it('dispatches PostScheduled when a draft gains a future published_at', function (): void {
        Event::fake([PostPublished::class, PostScheduled::class, PostUpdated::class, PostUnpublished::class]);

        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Later',
            'slug' => 'later',
        ]);

        $scheduledAt = now()->addWeek()->format('Y-m-d H:i:s');

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Later',
                'slug' => 'later',
                'published_at' => $scheduledAt,
            ])
            ->assertOk();

        Event::assertDispatched(PostScheduled::class, fn (PostScheduled $event): bool => $event->post->id === $post->id);
        Event::assertNotDispatched(PostPublished::class);
        Event::assertNotDispatched(PostUpdated::class);
        Event::assertNotDispatched(PostUnpublished::class);
    });

    it('dispatches PostUpdated when promoting content changes on a live post', function (): void {
        Event::fake([PostPublished::class, PostScheduled::class, PostUpdated::class, PostUnpublished::class]);

        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'body' => 'Live body',
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Promoted Title',
                'slug' => 'promoted-slug',
                'body' => 'Promoted body',
                'published_at' => $post->published_at->format('Y-m-d H:i:s'),
                'promote' => true,
            ])
            ->assertOk();

        Event::assertDispatched(PostUpdated::class, fn (PostUpdated $event): bool => $event->post->id === $post->id
            && $event->post->title === 'Promoted Title');
        Event::assertNotDispatched(PostPublished::class);
        Event::assertNotDispatched(PostScheduled::class);
        Event::assertNotDispatched(PostUnpublished::class);
    });

    it('does not dispatch PostUpdated when promote leaves the public fingerprint unchanged', function (): void {
        Event::fake([PostPublished::class, PostScheduled::class, PostUpdated::class, PostUnpublished::class]);

        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'summary' => null,
            'body' => 'Live body',
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Live Title',
                'slug' => 'live-slug',
                'summary' => null,
                'body' => 'Live body',
                'featured_image' => null,
                'featured_image_caption' => null,
                'meta' => null,
                'tags' => [],
                'topic' => [],
                'published_at' => $post->published_at->format('Y-m-d H:i:s'),
                'promote' => true,
            ])
            ->assertOk();

        Event::assertNothingDispatched();
    });

    it('dispatches PostUnpublished when clearing published_at on a live post', function (): void {
        Event::fake([PostPublished::class, PostScheduled::class, PostUpdated::class, PostUnpublished::class]);

        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Live Title',
                'slug' => 'live-slug',
                'published_at' => null,
            ])
            ->assertOk();

        Event::assertDispatched(PostUnpublished::class, fn (PostUnpublished $event): bool => $event->post->id === $post->id);
        Event::assertNotDispatched(PostPublished::class);
        Event::assertNotDispatched(PostScheduled::class);
        Event::assertNotDispatched(PostUpdated::class);
    });

    it('dispatches PostUnpublished then PostScheduled when a live post is moved to the future', function (): void {
        Event::fake([PostPublished::class, PostScheduled::class, PostUpdated::class, PostUnpublished::class]);

        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
            'title' => 'Live Title',
            'slug' => 'live-slug',
            'body' => 'Live body',
            'published_at' => now()->subDay(),
        ]);

        $scheduledAt = now()->addWeek()->format('Y-m-d H:i:s');

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Live Title',
                'slug' => 'live-slug',
                'body' => 'Live body',
                'published_at' => $scheduledAt,
                'promote' => true,
            ])
            ->assertOk();

        Event::assertDispatched(PostUnpublished::class, fn (PostUnpublished $event): bool => $event->post->id === $post->id);
        Event::assertDispatched(PostScheduled::class, fn (PostScheduled $event): bool => $event->post->id === $post->id);
        Event::assertNotDispatched(PostPublished::class);
        Event::assertNotDispatched(PostUpdated::class);
    });

    it('dispatches PostPublished when a scheduled post becomes live', function (): void {
        Event::fake([PostPublished::class, PostScheduled::class, PostUpdated::class, PostUnpublished::class]);

        $post = Post::factory()->scheduled()->create([
            'user_id' => $this->admin->id,
            'title' => 'Soon',
            'slug' => 'soon',
        ]);

        $publishedAt = now()->subHour()->format('Y-m-d H:i:s');

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Soon',
                'slug' => 'soon',
                'published_at' => $publishedAt,
            ])
            ->assertOk();

        Event::assertDispatched(PostPublished::class, fn (PostPublished $event): bool => $event->post->id === $post->id);
        Event::assertNotDispatched(PostScheduled::class);
        Event::assertNotDispatched(PostUpdated::class);
        Event::assertNotDispatched(PostUnpublished::class);
    });

    it('dispatches PostDeleted when a post is destroyed', function (): void {
        Event::fake([
            PostPublished::class,
            PostScheduled::class,
            PostUpdated::class,
            PostUnpublished::class,
            PostDeleted::class,
        ]);

        $post = Post::factory()->create([
            'user_id' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->deleteJson("canvas/api/posts/{$post->id}")
            ->assertNoContent();

        Event::assertDispatched(PostDeleted::class, fn (PostDeleted $event): bool => $event->post->id === $post->id);
        Event::assertNotDispatched(PostPublished::class);
        Event::assertNotDispatched(PostUnpublished::class);
    });
});
