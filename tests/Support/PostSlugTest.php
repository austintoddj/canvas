<?php

use Canvas\Models\Post;
use Canvas\Support\PostSlug;
use Illuminate\Support\Str;

// Invariant: new collisions are suffixed; a post's own slug is kept; public lookup is stable.
uses()->group('database');

it('suffixes a new post when the slug is already used', function (): void {
    $existing = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'hello-world',
        'title' => 'Original',
    ]);

    $id = (string) Str::uuid();

    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/posts/{$id}", [
            'slug' => 'hello-world',
            'title' => 'Another hello',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'hello-world-2');

    expect($existing->fresh()->slug)->toBe('hello-world')
        ->and(Post::query()->find($id)?->slug)->toBe('hello-world-2');
});

it('does not suffix a post when it is saved with its own slug', function (): void {
    $post = Post::factory()->draft()->create([
        'user_id' => $this->admin->id,
        'slug' => 'my-slug',
        'title' => 'Mine',
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/posts/{$post->id}", [
            'slug' => 'my-slug',
            'title' => 'Mine, edited',
        ])
        ->assertOk()
        ->assertJsonPath('slug', 'my-slug');

    expect($post->fresh()->slug)->toBe('my-slug');
});

it('does not suffix a legacy slug this post already shares', function (): void {
    $other = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'shared-slug',
    ]);
    $post = Post::factory()->draft()->create([
        'user_id' => $this->editor->id,
        'slug' => 'shared-slug',
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/posts/{$post->id}", [
            'slug' => 'shared-slug',
            'title' => 'Still shared',
        ])
        ->assertOk()
        ->assertJsonPath('slug', 'shared-slug');

    expect($post->fresh()->slug)->toBe('shared-slug')
        ->and($other->fresh()->slug)->toBe('shared-slug');
});

it('suffixes only the post whose slug is being changed', function (): void {
    $other = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'taken-slug',
    ]);
    $post = Post::factory()->draft()->create([
        'user_id' => $this->editor->id,
        'slug' => 'mine',
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/posts/{$post->id}", [
            'slug' => 'taken-slug',
            'title' => 'Now taken',
        ])
        ->assertOk()
        ->assertJsonPath('slug', 'taken-slug-2');

    expect($post->fresh()->slug)->toBe('taken-slug-2')
        ->and($other->fresh()->slug)->toBe('taken-slug');
});

it('does not keep appending a suffix when a later save resubmits the original slug', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'hello-world',
    ]);

    $post = Post::factory()->draft()->create([
        'user_id' => $this->editor->id,
        'slug' => 'hello-world-2',
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/posts/{$post->id}", [
            'slug' => 'hello-world',
            'title' => 'Still the second',
        ])
        ->assertOk()
        ->assertJsonPath('slug', 'hello-world-2');

    expect($post->fresh()->slug)->toBe('hello-world-2');
});

it('uses the next free numeric suffix', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'hello-world',
    ]);
    Post::factory()->create([
        'user_id' => $this->editor->id,
        'slug' => 'hello-world-2',
    ]);

    $id = (string) Str::uuid();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/posts/{$id}", [
            'slug' => 'hello-world',
            'title' => 'Third',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'hello-world-3');
});

it('suffixes around the same author trashed slug and leaves that row alone', function (): void {
    $trashed = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'recycled',
    ]);
    $trashed->delete();

    $id = (string) Str::uuid();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/posts/{$id}", [
            'slug' => 'recycled',
            'title' => 'Again',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'recycled-2');

    expect(Post::withTrashed()->find($trashed->id)?->slug)->toBe('recycled');
});

it('reuses a slug that only another author has deleted', function (): void {
    $trashed = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'recycled',
    ]);
    $trashed->delete();

    $id = (string) Str::uuid();

    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/posts/{$id}", [
            'slug' => 'recycled',
            'title' => 'Editor copy',
        ])
        ->assertCreated()
        ->assertJsonPath('slug', 'recycled');

    expect(Post::withTrashed()->find($trashed->id)?->slug)->toBe('recycled');
});

it('stores a colliding slug on a live post in pending until promote', function (): void {
    $other = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'taken-slug',
        'published_at' => now()->subDays(2),
    ]);
    $post = Post::factory()->create([
        'user_id' => $this->editor->id,
        'slug' => 'live-slug',
        'title' => 'Live',
        'published_at' => now()->subDay(),
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/posts/{$post->id}", [
            'slug' => 'taken-slug',
            'title' => 'Pending title',
            'published_at' => $post->published_at->toIso8601String(),
        ])
        ->assertOk()
        ->assertJsonPath('slug', 'live-slug')
        ->assertJsonPath('pending.slug', 'taken-slug-2');

    expect($post->fresh()->slug)->toBe('live-slug')
        ->and($other->fresh()->slug)->toBe('taken-slug');

    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/posts/{$post->id}", [
            'slug' => 'taken-slug-2',
            'title' => 'Pending title',
            'published_at' => $post->published_at->toIso8601String(),
            'promote' => true,
        ])
        ->assertOk()
        ->assertJsonPath('slug', 'taken-slug-2');

    expect($post->fresh()->slug)->toBe('taken-slug-2')
        ->and($other->fresh()->slug)->toBe('taken-slug');
});

it('resolves a duplicated public slug to the earliest published post, then the lowest id', function (): void {
    $publishedAt = now()->subDay()->startOfSecond();

    $higherId = Post::factory()->create([
        'id' => 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'user_id' => $this->admin->id,
        'slug' => 'shared-slug',
        'title' => 'Higher id',
        'published_at' => $publishedAt,
    ]);

    $lowerId = Post::factory()->create([
        'id' => 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'user_id' => $this->editor->id,
        'slug' => 'shared-slug',
        'title' => 'Lower id',
        'published_at' => $publishedAt,
    ]);

    $older = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'older-slug',
        'published_at' => now()->subDays(4),
    ]);
    Post::factory()->create([
        'user_id' => $this->editor->id,
        'slug' => 'older-slug',
        'published_at' => now()->subHour(),
    ]);

    Post::factory()->draft()->create([
        'user_id' => $this->admin->id,
        'slug' => 'draft-only',
    ]);

    expect(Post::forPublicSlug('shared-slug')->first()?->id)->toBe($lowerId->id)
        ->and(Post::forPublicSlug('older-slug')->first()?->id)->toBe($older->id)
        ->and(Post::forPublicSlug('draft-only')->first())->toBeNull()
        ->and(Post::forPublicSlug('shared-slug')->pluck('id')->all())->toBe([$lowerId->id, $higherId->id]);

    expect(PostSlug::forSave('shared-slug', $lowerId))->toBe('shared-slug')
        ->and(PostSlug::forSave('shared-slug'))->toBe('shared-slug-2');
});
