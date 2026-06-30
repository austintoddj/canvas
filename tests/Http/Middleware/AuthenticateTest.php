<?php

use Canvas\Models\Media;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Tests\Models\User;
use Illuminate\Support\Facades\Route;
use Ramsey\Uuid\Uuid;

dataset('protectedRoutes', [
    ['GET', 'canvas'],
    ['GET', 'canvas/api'],
    ['GET', 'canvas/api/media'],
    ['GET', 'canvas/api/media/create'],
    ['POST', 'canvas/api/media/{id}'],
    ['DELETE', 'canvas/api/media/{media}'],
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

beforeEach(function (): void {
    Route::get('/login', fn () => 'login')->name('login');
});

it('redirects unauthenticated users to login', function ($method, $endpoint): void {
    $endpoint = strtr($endpoint, [
        '{id}' => Uuid::uuid4()->toString(),
        '{media}' => Media::factory()->create()->id,
        '{post}' => Post::factory()->create()->id,
        '{tag}' => Tag::factory()->create()->id,
        '{topic}' => Topic::factory()->create()->id,
        '{user}' => User::factory()->create()->id,
    ]);

    $this->assertGuest()
        ->call($method, $endpoint)
        ->assertRedirect('/login');
})->with('protectedRoutes');
