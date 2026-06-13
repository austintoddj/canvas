<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;

it('a contributor can only search their own posts', function (): void {
    Post::factory()->count(3)->create([
        'user_id' => $this->contributor->id,
    ]);

    Post::factory()->create([
        'user_id' => $this->admin->id,
    ]);

    $response = $this->actingAs($this->contributor, 'canvas')
        ->getJson('canvas/api/search/posts')
        ->assertSuccessful()
        ->assertJsonCount(3);

    $this->assertArrayHasKey('id', $response[0]);
    $this->assertArrayHasKey('title', $response[0]);
    $this->assertArrayHasKey('name', $response[0]);
    $this->assertArrayHasKey('type', $response[0]);
    $this->assertSame('Post', $response[0]['type']);
    $this->assertArrayHasKey('route', $response[0]);
    $this->assertSame('edit-post', $response[0]['route']);
});
it('an editor can search all posts', function (): void {
    Post::factory()->count(3)->create([
        'user_id' => $this->editor->id,
    ]);

    Post::factory()->create([
        'user_id' => $this->contributor->id,
    ]);

    $response = $this->actingAs($this->editor, 'canvas')
        ->getJson('canvas/api/search/posts')
        ->assertSuccessful()
        ->assertJsonCount(4);

    $this->assertArrayHasKey('id', $response[0]);
    $this->assertArrayHasKey('title', $response[0]);
    $this->assertArrayHasKey('name', $response[0]);
    $this->assertArrayHasKey('type', $response[0]);
    $this->assertSame('Post', $response[0]['type']);
    $this->assertArrayHasKey('route', $response[0]);
    $this->assertSame('edit-post', $response[0]['route']);
});
it('an admin can search all posts', function (): void {
    Post::factory()->count(3)->create([
        'user_id' => $this->editor->id,
    ]);

    Post::factory()->create([
        'user_id' => $this->contributor->id,
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search/posts')
        ->assertSuccessful()
        ->assertJsonCount(4);

    $this->assertArrayHasKey('id', $response[0]);
    $this->assertArrayHasKey('title', $response[0]);
    $this->assertArrayHasKey('name', $response[0]);
    $this->assertArrayHasKey('type', $response[0]);
    $this->assertSame('Post', $response[0]['type']);
    $this->assertArrayHasKey('route', $response[0]);
    $this->assertSame('edit-post', $response[0]['route']);
});
it('an admin can search all tags', function (): void {
    Tag::factory()->count(2)->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search/tags')
        ->assertSuccessful()
        ->assertJsonCount(2);

    $this->assertArrayHasKey('id', $response[0]);
    $this->assertArrayHasKey('name', $response[0]);
    $this->assertArrayHasKey('type', $response[0]);
    $this->assertSame('Tag', $response[0]['type']);
    $this->assertArrayHasKey('route', $response[0]);
    $this->assertSame('edit-tag', $response[0]['route']);
});
it('an admin can search all topics', function (): void {
    Topic::factory()->count(3)->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search/topics')
        ->assertSuccessful()
        ->assertJsonCount(3);

    $this->assertArrayHasKey('id', $response[0]);
    $this->assertArrayHasKey('name', $response[0]);
    $this->assertArrayHasKey('type', $response[0]);
    $this->assertSame('Topic', $response[0]['type']);
    $this->assertArrayHasKey('route', $response[0]);
    $this->assertSame('edit-topic', $response[0]['route']);
});
it('an admin can search all users', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/search/users')
        ->assertSuccessful()
        ->assertJsonCount(3);

    $this->assertArrayHasKey('id', $response[0]);
    $this->assertArrayHasKey('name', $response[0]);
    $this->assertArrayHasKey('type', $response[0]);
    $this->assertSame('User', $response[0]['type']);
    $this->assertArrayHasKey('route', $response[0]);
    $this->assertSame('edit-user', $response[0]['route']);
});
