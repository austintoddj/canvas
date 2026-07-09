<?php

use Canvas\Enums\Role;
use Canvas\Models\Media;
use Canvas\Tests\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

// Invariant: core admin API, shell, and access commands work with BareUser (no HasCanvasAccess)

beforeEach(function (): void {
    useBareUserModel();
    $this->seedDefaultCanvasUsers();
});

it('loads the canvas shell boot payload for a bare contributor', function (): void {
    $this->actingAs(bareUser($this->contributor->id), 'canvas')
        ->get(config('canvas.path'))
        ->assertSuccessful()
        ->assertViewIs('canvas::layout')
        ->assertViewHas('jsVars', function (array $vars): bool {
            return data_get($vars, 'user.id') === $this->contributor->id
                && data_get($vars, 'user.canvas.role') === Role::Contributor->value
                && data_get($vars, 'user.canvas.theme') !== null;
        });
});

it('lists and shows posts for a bare contributor', function (): void {
    $post = createPublishedPost(['user_id' => $this->contributor->id, 'title' => 'Bare Core Post']);

    $bare = bareUser($this->contributor->id);

    $this->actingAs($bare, 'canvas')
        ->getJson('canvas/api/posts')
        ->assertSuccessful()
        ->assertJsonPath('posts.data.0.id', $post->id);

    $this->actingAs($bare, 'canvas')
        ->getJson("canvas/api/posts/{$post->id}")
        ->assertSuccessful()
        ->assertJsonPath('post.title', 'Bare Core Post');
});

it('stores a post for a bare contributor', function (): void {
    $id = (string) Str::uuid();
    $bare = bareUser($this->contributor->id);

    $this->actingAs($bare, 'canvas')
        ->postJson("canvas/api/posts/{$id}", [
            'title' => 'Created Without Trait',
            'slug' => 'created-without-trait',
            'summary' => null,
            'body' => null,
            'published_at' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
            'topic' => [],
            'tags' => [],
        ])
        ->assertCreated();

    $this->assertDatabaseHas('canvas_posts', [
        'id' => $id,
        'user_id' => $this->contributor->id,
        'title' => 'Created Without Trait',
    ]);
});

it('lists media and stats for a bare contributor', function (): void {
    Storage::fake(config('canvas.storage_disk'));

    Media::factory()->create(['user_id' => $this->contributor->id]);
    createPublishedPost(['user_id' => $this->contributor->id]);

    $bare = bareUser($this->contributor->id);

    $this->actingAs($bare, 'canvas')
        ->getJson('canvas/api/media')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data');

    $this->actingAs($bare, 'canvas')
        ->getJson('canvas/api/stats')
        ->assertSuccessful()
        ->assertJsonStructure(['views', 'visits', 'graph']);
});

it('searches posts for a bare contributor', function (): void {
    createPublishedPost([
        'user_id' => $this->contributor->id,
        'title' => 'Searchable Bare Post',
    ]);

    $this->actingAs(bareUser($this->contributor->id), 'canvas')
        ->getJson('canvas/api/search?q=Searchable')
        ->assertSuccessful()
        ->assertJsonFragment([
            'title' => 'Searchable Bare Post',
            'type' => 'Post',
        ]);
});

it('manages taxonomy as a bare admin', function (): void {
    $tagId = (string) Str::uuid();
    $topicId = (string) Str::uuid();
    $bare = bareUser($this->admin->id);

    $this->actingAs($bare, 'canvas')
        ->postJson("canvas/api/tags/{$tagId}", [
            'name' => 'Bare Tag',
            'slug' => 'bare-tag',
        ])
        ->assertCreated();

    $this->actingAs($bare, 'canvas')
        ->postJson("canvas/api/topics/{$topicId}", [
            'name' => 'Bare Topic',
            'slug' => 'bare-topic',
        ])
        ->assertCreated();

    $this->actingAs($bare, 'canvas')
        ->getJson('canvas/api/tags')
        ->assertSuccessful()
        ->assertJsonFragment(['name' => 'Bare Tag']);

    $this->actingAs($bare, 'canvas')
        ->getJson('canvas/api/topics')
        ->assertSuccessful()
        ->assertJsonFragment(['name' => 'Bare Topic']);
});

it('runs access console commands against bare host identity', function (): void {
    $host = User::factory()->create([
        'name' => 'CLI Bare User',
        'email' => 'cli-bare@example.com',
    ]);

    $this->artisan('canvas:assign-role', [
        'user' => $host->email,
        'role' => 'editor',
    ])->assertSuccessful();

    $this->assertDatabaseHas('canvas_users', [
        'user_id' => $host->id,
        'role' => Role::Editor->value,
    ]);

    $this->artisan('canvas:users', ['user' => (string) $host->id])
        ->assertSuccessful()
        ->expectsOutputToContain('cli-bare@example.com');

    $this->artisan('canvas:users')
        ->assertSuccessful()
        ->expectsOutputToContain('CLI Bare User');

    $this->artisan('canvas:remove-access', ['user' => $host->email])
        ->assertSuccessful();

    $this->assertDatabaseMissing('canvas_users', [
        'user_id' => $host->id,
    ]);
});

it('forbids bare hosts without a canvas_users row on admin routes', function (): void {
    $host = User::factory()->create();

    $this->actingAs(bareUser($host->id), 'canvas')
        ->getJson('canvas/api/posts')
        ->assertForbidden();
});
