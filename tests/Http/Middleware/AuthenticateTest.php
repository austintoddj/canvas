<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Ramsey\Uuid\Uuid;

dataset('protectedRoutes', [
    ['GET', 'canvas'],
    ['GET', 'canvas/api'],
    ['POST', 'canvas/api/uploads'],
    ['DELETE', 'canvas/api/uploads'],
    ['GET', 'canvas/api/posts'],
    ['GET', 'canvas/api/posts/create'],
    ['GET', 'canvas/api/posts/{post}'],
    ['GET', 'canvas/api/posts/{post}/stats'],
    ['POST', 'canvas/api/posts/{id}'],
    ['DELETE', 'canvas/api/posts/{post}'],
    ['GET', 'canvas/api/tags'],
    ['GET', 'canvas/api/tags/create'],
    ['GET', 'canvas/api/tags/{tag}'],
    ['GET', 'canvas/api/tags/{tag}/posts'],
    ['POST', 'canvas/api/tags/{id}'],
    ['DELETE', 'canvas/api/tags/{tag}'],
    ['GET', 'canvas/api/topics'],
    ['GET', 'canvas/api/topics/create'],
    ['GET', 'canvas/api/topics/{topic}'],
    ['GET', 'canvas/api/topics/{topic}/posts'],
    ['POST', 'canvas/api/topics/{id}'],
    ['DELETE', 'canvas/api/topics/{topic}'],
    ['GET', 'canvas/api/users'],
    ['GET', 'canvas/api/users/create'],
    ['GET', 'canvas/api/users/{user}'],
    ['GET', 'canvas/api/users/{user}/posts'],
    ['POST', 'canvas/api/users/{id}'],
    ['DELETE', 'canvas/api/users/{user}'],
    ['GET', 'canvas/api/search/posts'],
    ['GET', 'canvas/api/search/tags'],
    ['GET', 'canvas/api/search/topics'],
    ['GET', 'canvas/api/search/users'],
]);

it('redirects unauthenticated users to login', function ($method, $endpoint): void {
    $endpoint = strtr($endpoint, [
        '{id}' => Uuid::uuid4()->toString(),
        '{post}' => Post::factory()->create()->id,
        '{tag}' => Tag::factory()->create()->id,
        '{topic}' => Topic::factory()->create()->id,
        '{user}' => User::factory()->create()->id,
    ]);

    $this->assertGuest()
        ->call($method, $endpoint)
        ->assertRedirect(route('canvas.login'));
})->with('protectedRoutes');

it('redirects authenticated users to canvas', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->get(route('canvas.login'))
        ->assertRedirect(config('canvas.path'));

    $this->actingAs($this->admin, 'canvas')
        ->get('canvas/api')
        ->assertSuccessful();
});
