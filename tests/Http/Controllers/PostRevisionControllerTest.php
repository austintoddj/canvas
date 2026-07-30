<?php

use Canvas\Models\Post;
use Canvas\Models\PostRevision;
use Illuminate\Support\Str;

describe('when listing post revisions', function (): void {
    it('lists lean revisions without body for a post the user can view', function (): void {
        $post = Post::factory()->create(['user_id' => $this->admin->id]);
        $older = PostRevision::factory()->create([
            'post_id' => $post->id,
            'user_id' => $this->admin->id,
            'title' => 'Older',
            'body' => 'Older body',
            'created_at' => now()->subHour(),
        ]);
        $newer = PostRevision::factory()->create([
            'post_id' => $post->id,
            'user_id' => $this->admin->id,
            'title' => 'Newer',
            'body' => 'Newer body',
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->admin, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}/revisions")
            ->assertSuccessful()
            ->assertJsonStructure([
                'revisions' => [
                    ['id', 'post_id', 'label', 'title', 'created_at', 'user'],
                ],
            ]);

        $ids = collect($response->json('revisions'))->pluck('id')->all();
        $first = $response->json('revisions.0');

        expect($ids)->toBe([$newer->id, $older->id])
            ->and(array_key_exists('body', $first))->toBeFalse()
            ->and(array_key_exists('slug', $first))->toBeFalse()
            ->and($first['user']['id'] ?? null)->toBe($this->admin->id)
            ->and($first['user']['name'] ?? null)->not->toBeNull();
    });

    it('returns full body on show for diff', function (): void {
        $post = Post::factory()->create(['user_id' => $this->admin->id]);
        $revision = PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'Full',
            'body' => 'Full body HTML',
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}/revisions/{$revision->id}")
            ->assertSuccessful()
            ->assertJsonPath('revision.body', 'Full body HTML')
            ->assertJsonPath('revision.title', 'Full');
    });

    it('hides revisions for another contributors post', function (): void {
        $post = Post::factory()->create(['user_id' => $this->admin->id]);
        PostRevision::factory()->create(['post_id' => $post->id]);

        $this->actingAs($this->contributor, 'canvas')
            ->getJson("canvas/api/posts/{$post->id}/revisions")
            ->assertNotFound();
    });
});

describe('when saving a post', function (): void {
    // Regression: first contentful store creates origin checkpoint.
    it('creates a revision when content is first saved', function (): void {
        $id = (string) Str::uuid();

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$id}", [
                'title' => 'First draft',
                'slug' => 'first-draft',
                'body' => 'Hello world',
                'summary' => 'A summary',
            ])
            ->assertCreated();

        $post = Post::query()->findOrFail($id);

        expect($post->revisions)->toHaveCount(1)
            ->and($post->revisions->first()?->title)->toBe('First draft')
            ->and($post->revisions->first()?->body)->toBe('Hello world');
    });

    // Invariant: draft content autosave after origin does not append history.
    it('does not create another revision on later draft content autosave', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'V1',
            'slug' => 'v1',
            'body' => 'Body one',
        ]);

        PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'V1',
            'slug' => 'v1',
            'body' => 'Body one',
            'summary' => $post->summary,
            'featured_image' => $post->featured_image,
            'featured_image_caption' => $post->featured_image_caption,
            'meta' => $post->meta,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'V2',
                'slug' => 'v1',
                'body' => 'Body two',
                'summary' => $post->summary,
            ])
            ->assertSuccessful();

        expect($post->fresh()->revisions)->toHaveCount(1)
            ->and($post->fresh()->revisions->first()?->title)->toBe('V1');
    });

    it('does not create a revision when draft content is unchanged', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Same',
            'slug' => 'same',
            'body' => 'Same body',
            'summary' => 'Same summary',
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'Same',
            'slug' => 'same',
            'body' => 'Same body',
            'summary' => 'Same summary',
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Same',
                'slug' => 'same',
                'body' => 'Same body',
                'summary' => 'Same summary',
            ])
            ->assertSuccessful();

        expect($post->fresh()->revisions)->toHaveCount(1);
    });

    // Invariant: live pending autosaves are Tier B — no history rows.
    it('does not record pending content autosaves for live posts', function (): void {
        $post = createPublishedPost([
            'user_id' => $this->admin->id,
            'title' => 'Live',
            'slug' => 'live',
            'body' => 'Live body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'Live',
            'slug' => 'live',
            'body' => 'Live body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Pending title',
                'slug' => 'live',
                'body' => 'Pending body',
            ])
            ->assertSuccessful();

        expect($post->fresh()->revisions)->toHaveCount(1)
            ->and($post->fresh()->has_pending_changes)->toBeTrue();
    });

    // Invariant: scheduled content autosave must not spam history.
    it('does not record scheduled content autosaves when published_at is unchanged', function (): void {
        $at = now()->addWeek();
        $post = Post::factory()->scheduled()->create([
            'user_id' => $this->admin->id,
            'title' => 'Scheduled',
            'slug' => 'scheduled',
            'body' => 'Body one',
            'published_at' => $at,
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'Scheduled',
            'slug' => 'scheduled',
            'body' => 'Body one',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Scheduled edited',
                'slug' => 'scheduled',
                'body' => 'Body two',
                'published_at' => publishedAtIso($at),
            ])
            ->assertSuccessful();

        expect($post->fresh()->revisions)->toHaveCount(1);
    });

    // Regression: double-record on first publish — one published row, not origin+published.
    it('records a single published checkpoint when first save also publishes', function (): void {
        $id = (string) Str::uuid();

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$id}", [
                'title' => 'Go live',
                'slug' => 'go-live',
                'body' => 'Hello',
                'promote' => true,
                'publish_now' => true,
            ])
            ->assertCreated();

        $post = Post::query()->findOrFail($id);

        expect($post->revisions)->toHaveCount(1)
            ->and($post->revisions->first()?->label)->toBeNull()
            ->and($post->revisions->first()?->title)->toBe('Go live');
    });

    it('records a checkpoint on live update promote when content changes', function (): void {
        $post = createPublishedPost([
            'user_id' => $this->admin->id,
            'title' => 'Live',
            'slug' => 'live-update',
            'body' => 'Live body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'Live',
            'slug' => 'live-update',
            'body' => 'Live body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Updated live',
                'slug' => 'live-update',
                'body' => 'Updated body',
                'promote' => true,
            ])
            ->assertSuccessful();

        expect($post->fresh()->revisions)->toHaveCount(2)
            ->and($post->fresh()->revisions->pluck('title'))->toContain('Updated live');
    });

    it('skips no-op live update promote when content matches latest', function (): void {
        $post = createPublishedPost([
            'user_id' => $this->admin->id,
            'title' => 'Live',
            'slug' => 'live-noop',
            'body' => 'Live body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'Live',
            'slug' => 'live-noop',
            'body' => 'Live body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}", [
                'title' => 'Live',
                'slug' => 'live-noop',
                'body' => 'Live body',
                'promote' => true,
            ])
            ->assertSuccessful();

        expect($post->fresh()->revisions)->toHaveCount(1);
    });
});

describe('when creating a leave-editor revision', function (): void {
    it('creates a checkpoint when leaving with content', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Draft',
            'slug' => 'draft-leave',
            'body' => 'Body',
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}/revisions", [])
            ->assertCreated()
            ->assertJsonPath('revision.label', null)
            ->assertJsonPath('revision.title', 'Draft');

        expect($post->fresh()->revisions)->toHaveCount(1);
    });

    it('skips a leave checkpoint when content matches the latest revision', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Same',
            'slug' => 'same-leave',
            'body' => 'Same body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'Same',
            'slug' => 'same-leave',
            'body' => 'Same body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}/revisions", [])
            ->assertStatus(422)
            ->assertJsonPath('code', 'revision_empty');

        expect($post->fresh()->revisions)->toHaveCount(1);
    });

    it('still records a leave checkpoint when content changed since the latest', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'After edits',
            'slug' => 'after-edits',
            'body' => 'New body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'Before',
            'slug' => 'after-edits',
            'body' => 'Old body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}/revisions", [])
            ->assertCreated()
            ->assertJsonPath('revision.title', 'After edits')
            ->assertJsonPath('revision.body', 'New body');

        expect($post->fresh()->revisions)->toHaveCount(2);
    });

    it('rejects empty content leave checkpoint', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => null,
            'slug' => 'empty-leave',
            'body' => null,
            'summary' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}/revisions", [])
            ->assertStatus(422)
            ->assertJsonPath('code', 'revision_empty');
    });
});

describe('when renaming a revision', function (): void {
    it('updates the stored label and returns lean shape', function (): void {
        $post = Post::factory()->create(['user_id' => $this->admin->id]);
        $revision = PostRevision::factory()->create([
            'post_id' => $post->id,
            'label' => null,
            'body' => 'Secret body',
        ]);

        $response = $this->actingAs($this->admin, 'canvas')
            ->putJson("canvas/api/posts/{$post->id}/revisions/{$revision->id}", [
                'label' => 'Before launch',
            ])
            ->assertSuccessful()
            ->assertJsonPath('revision.label', 'Before launch');

        expect(array_key_exists('body', $response->json('revision')))->toBeFalse()
            ->and($revision->fresh()->label)->toBe('Before launch');
    });

    it('clears the label when empty', function (): void {
        $post = Post::factory()->create(['user_id' => $this->admin->id]);
        $revision = PostRevision::factory()->create([
            'post_id' => $post->id,
            'label' => 'Named',
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->putJson("canvas/api/posts/{$post->id}/revisions/{$revision->id}", [
                'label' => '',
            ])
            ->assertSuccessful()
            ->assertJsonPath('revision.label', null);

        expect($revision->fresh()->label)->toBeNull();
    });
});

describe('when restoring a revision', function (): void {
    it('applies snapshot fields to a draft post and records a branch', function (): void {
        $post = Post::factory()->draft()->create([
            'user_id' => $this->admin->id,
            'title' => 'Current',
            'slug' => 'current',
            'body' => 'Current body',
            'summary' => 'Current summary',
        ]);

        $revision = PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'Restored title',
            'slug' => 'restored-slug',
            'body' => 'Restored body',
            'summary' => 'Restored summary',
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => ['title' => 'SEO'],
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}/revisions/{$revision->id}/restore")
            ->assertSuccessful()
            ->assertJsonPath('title', 'Restored title')
            ->assertJsonPath('body', 'Restored body')
            ->assertJsonPath('summary', 'Restored summary')
            ->assertJsonPath('slug', 'restored-slug');

        $post->refresh();

        expect($post->title)->toBe('Restored title')
            ->and($post->body)->toBe('Restored body')
            ->and($post->slug)->toBe('restored-slug')
            ->and($post->revisions)->toHaveCount(2);
    });

    it('writes pending content when restoring onto a live post and records a branch', function (): void {
        $post = createPublishedPost([
            'user_id' => $this->admin->id,
            'title' => 'Live title',
            'slug' => 'live-title',
            'body' => 'Live body',
        ]);

        $revision = PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => 'Old version',
            'slug' => 'live-title',
            'body' => 'Old body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}/revisions/{$revision->id}/restore")
            ->assertSuccessful()
            ->assertJsonPath('title', 'Live title')
            ->assertJsonPath('has_pending_changes', true)
            ->assertJsonPath('pending.title', 'Old version')
            ->assertJsonPath('pending.body', 'Old body');

        $post->refresh();

        expect($post->title)->toBe('Live title')
            ->and($post->has_pending_changes)->toBeTrue()
            ->and(data_get($post->pending, 'title'))->toBe('Old version')
            ->and($post->revisions)->toHaveCount(2);
    });

    it('rejects restore for a revision on another post', function (): void {
        $post = Post::factory()->create(['user_id' => $this->admin->id]);
        $other = Post::factory()->create(['user_id' => $this->admin->id]);
        $revision = PostRevision::factory()->create(['post_id' => $other->id]);

        $this->actingAs($this->admin, 'canvas')
            ->postJson("canvas/api/posts/{$post->id}/revisions/{$revision->id}/restore")
            ->assertNotFound();
    });
});
