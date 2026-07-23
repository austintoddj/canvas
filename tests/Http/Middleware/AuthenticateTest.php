<?php

use Illuminate\Support\Facades\Route;

dataset('authenticateProtectedRoutes', [
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
    ['GET', 'canvas/api/users/lookup'],
    ['GET', 'canvas/api/users/{user}'],
    ['GET', 'canvas/api/users/{user}/posts'],
    ['POST', 'canvas/api/users/{id}'],
    ['DELETE', 'canvas/api/users/{user}'],
    ['GET', 'canvas/api/search/posts'],
    ['GET', 'canvas/api/search/tags'],
    ['GET', 'canvas/api/search/topics'],
    ['GET', 'canvas/api/search/users'],
]);

function authenticateRoutePlaceholders(): array
{
    return [
        '{id}' => '11111111-1111-1111-1111-111111111111',
        '{media}' => '22222222-2222-2222-2222-222222222222',
        '{post}' => '33333333-3333-3333-3333-333333333333',
        '{tag}' => '44444444-4444-4444-4444-444444444444',
        '{topic}' => '55555555-5555-5555-5555-555555555555',
        '{user}' => '66666666-6666-6666-6666-666666666666',
    ];
}

beforeEach(function (): void {
    Route::get('/login', fn () => 'login')->name('login');
});

it('redirects unauthenticated users to login', function ($method, $endpoint): void {
    $endpoint = strtr($endpoint, authenticateRoutePlaceholders());

    $this->assertGuest()
        ->call($method, $endpoint)
        ->assertRedirect('/login');
})->with('authenticateProtectedRoutes');
