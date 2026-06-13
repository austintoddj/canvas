<?php

dataset('protectedRoutes', [
    ['GET', 'canvas'],
    ['GET', 'canvas/api'],
    ['POST', 'canvas/api/uploads'],
    ['DELETE', 'canvas/api/uploads'],
    ['GET', 'canvas/api/posts'],
    ['GET', 'canvas/api/posts/create'],
    ['GET', 'canvas/api/posts/{id}'],
    ['GET', 'canvas/api/posts/{id}/stats'],
    ['POST', 'canvas/api/posts/{id}'],
    ['DELETE', 'canvas/api/posts/{id}'],
    ['GET', 'canvas/api/tags'],
    ['GET', 'canvas/api/tags/create'],
    ['GET', 'canvas/api/tags/{id}'],
    ['GET', 'canvas/api/tags/{id}/posts'],
    ['POST', 'canvas/api/tags/{id}'],
    ['DELETE', 'canvas/api/tags/{id}'],
    ['GET', 'canvas/api/topics'],
    ['GET', 'canvas/api/topics/create'],
    ['GET', 'canvas/api/topics/{id}'],
    ['GET', 'canvas/api/topics/{id}/posts'],
    ['POST', 'canvas/api/topics/{id}'],
    ['DELETE', 'canvas/api/topics/{id}'],
    ['GET', 'canvas/api/users'],
    ['GET', 'canvas/api/users/create'],
    ['GET', 'canvas/api/users/{id}'],
    ['GET', 'canvas/api/users/{id}/posts'],
    ['POST', 'canvas/api/users/{id}'],
    ['DELETE', 'canvas/api/users/{id}'],
    ['GET', 'canvas/api/search/posts'],
    ['GET', 'canvas/api/search/tags'],
    ['GET', 'canvas/api/search/topics'],
    ['GET', 'canvas/api/search/users'],
]);

it('redirects unauthenticated users to login', function ($method, $endpoint): void {
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
