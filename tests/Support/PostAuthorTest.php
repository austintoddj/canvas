<?php

use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Support\PostAuthor;
use Canvas\Tests\Models\User;

it('returns null when a post has no user_id', function (): void {
    $post = Post::factory()->make(['user_id' => null]);

    expect(PostAuthor::for($post))->toBeNull();
});

it('returns null when the host user cannot be resolved', function (): void {
    $user = User::factory()->create();
    $post = Post::factory()->create([
        'user_id' => $user->id,
    ]);

    $user->delete();

    expect(PostAuthor::for($post->fresh()))->toBeNull();
});
it('builds a display-only author payload from the host user and canvas profile', function (): void {
    $user = User::factory()->create(['name' => 'Ada Lovelace']);

    CanvasUser::factory()->create([
        'user_id' => $user->id,
        'username' => 'ada',
        'avatar' => 'https://cdn.example.com/ada.jpg',
    ]);

    $post = Post::factory()->create(['user_id' => $user->id]);

    expect(PostAuthor::for($post))->toMatchArray([
        'id' => $user->id,
        'name' => 'Ada Lovelace',
        'username' => 'ada',
        'avatar_url' => 'https://cdn.example.com/ada.jpg',
    ]);
});

it('uses an already-loaded user relation without querying the host model', function (): void {
    $user = User::factory()->create(['name' => 'Grace Hopper']);

    CanvasUser::factory()->create([
        'user_id' => $user->id,
        'username' => 'grace',
        'avatar' => null,
    ]);

    $post = Post::factory()->create(['user_id' => $user->id]);
    $post->setRelation('user', $user);

    expect(PostAuthor::for($post))->toMatchArray([
        'id' => $user->id,
        'name' => 'Grace Hopper',
        'username' => 'grace',
        'avatar_url' => null,
    ]);
});

it('returns null when a loaded user relation is not a model', function (): void {
    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
    ]);
    $post->setRelation('user', null);

    expect(PostAuthor::for($post))->toBeNull();
});
