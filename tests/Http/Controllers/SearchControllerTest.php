<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Tests\Models\User;

it('returns only a contributors own posts', function (): void {
    Post::factory()->count(3)->create(['user_id' => $this->contributor->id]);
    Post::factory()->create(['user_id' => $this->admin->id]);

    $response = $this->actingAs($this->contributor, 'canvas')
        ->getJson('canvas/api/search')
        ->assertSuccessful();

    $response->assertJsonCount(3);
    $response->assertJsonFragment(['type' => 'Post']);
    $response->assertJsonMissingPath('0.name');
    $response->assertJsonStructure(['*' => ['id', 'title', 'type', 'route']]);
});

it('returns all posts for an editor', function (): void {
    Post::factory()->count(3)->create(['user_id' => $this->editor->id]);
    Post::factory()->create(['user_id' => $this->contributor->id]);

    $response = $this->actingAs($this->editor, 'canvas')
        ->getJson('canvas/api/search')
        ->assertSuccessful();

    expect(collect($response->json())->where('type', 'Post'))->toHaveCount(4);
});

it('returns all posts for an admin', function (): void {
    Post::factory()->count(3)->create(['user_id' => $this->editor->id]);
    Post::factory()->create(['user_id' => $this->contributor->id]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search')
        ->assertSuccessful();

    expect(collect($response->json())->where('type', 'Post'))->toHaveCount(4);
});

it('includes tags and topics for an admin', function (): void {
    Tag::factory()->count(2)->create();
    Topic::factory()->count(3)->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search')
        ->assertSuccessful();

    $response->assertJsonFragment(['type' => 'Tag']);
    $response->assertJsonFragment(['type' => 'Topic']);
});

it('excludes tags and topics for a contributor', function (): void {
    Tag::factory()->count(2)->create();
    Topic::factory()->count(2)->create();

    $response = $this->actingAs($this->contributor, 'canvas')
        ->getJson('canvas/api/search')
        ->assertSuccessful();

    $response->assertJsonMissingPath('0.type');
    collect($response->json())->each(fn ($item) => expect($item['type'])->not->toBeIn(['Tag', 'Topic', 'User']));
});

it('includes users with email for an admin', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search')
        ->assertSuccessful();

    $users = collect($response->json())->where('type', 'User');

    expect($users)->not->toBeEmpty();
    $users->each(fn ($user) => expect($user)->toHaveKeys([
        'id',
        'name',
        'email',
        'username',
        'avatar_url',
        'type',
        'route',
    ]));
});

it('filters users by username for an admin', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search?q='.$this->editor->username)
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $this->editor->id,
            'type' => 'User',
        ]);
});

it('excludes users for a contributor', function (): void {
    $response = $this->actingAs($this->contributor, 'canvas')
        ->getJson('canvas/api/search')
        ->assertSuccessful();

    $users = collect($response->json())->where('type', 'User');

    expect($users)->toBeEmpty();
});

it('filters posts by query at the database level', function (): void {
    Post::factory()->create(['title' => 'Hello World', 'user_id' => $this->admin->id]);
    Post::factory()->create(['title' => 'Goodbye World', 'user_id' => $this->admin->id]);
    Post::factory()->create(['title' => 'Unrelated', 'user_id' => $this->admin->id]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search?q=World')
        ->assertSuccessful();

    $posts = collect($response->json())->where('type', 'Post');

    expect($posts)->toHaveCount(2);
    $posts->each(fn ($post) => expect($post['title'])->toContain('World'));
});

it('returns no results when query matches nothing', function (): void {
    Post::factory()->create(['title' => 'Hello World', 'user_id' => $this->admin->id]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search?q=zzznomatch')
        ->assertSuccessful();

    expect($response->json())->toBeEmpty();
});

it('returns all results when query is empty', function (): void {
    Post::factory()->count(3)->create(['user_id' => $this->admin->id]);
    Tag::factory()->count(2)->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search?q=')
        ->assertSuccessful();

    expect(collect($response->json())->where('type', 'Post'))->toHaveCount(3);
    expect(collect($response->json())->where('type', 'Tag'))->toHaveCount(2);
});

it('filters results by type', function (): void {
    Post::factory()->count(3)->create(['user_id' => $this->admin->id]);
    Tag::factory()->count(2)->create();
    Topic::factory()->count(4)->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search?type=tag')
        ->assertSuccessful();

    expect(collect($response->json())->where('type', 'Tag'))->toHaveCount(2);
    expect(collect($response->json())->where('type', 'Post'))->toBeEmpty();
    expect(collect($response->json())->where('type', 'Topic'))->toBeEmpty();
});

// Invariant: user search filters resolved names before limiting results, across batches.
it('finds older users by display name beyond the first batch and limits matches', function (): void {
    $admin = $this->admin;
    $author = User::factory()->contributor()->create(['name' => 'Older Writer']);
    User::factory()->contributor()->count(101)->create(['name' => 'Newer Writer']);

    $this->actingAs($admin, 'canvas')
        ->getJson('canvas/api/search?type=user&q=older')
        ->assertSuccessful()
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', $author->id);

    $this->getJson('canvas/api/search?type=user&q=Writer')
        ->assertSuccessful()
        ->assertJsonCount(10);
});
