<?php

dataset('protectedRoutes', [
    ['GET', 'canvas/api/tags'],
    ['GET', 'canvas/api/tags/create'],
    ['GET', 'canvas/api/topics'],
    ['GET', 'canvas/api/topics/create'],
    ['GET', 'canvas/api/users'],
    ['GET', 'canvas/api/users/create'],
    ['GET', 'canvas/api/search/tags'],
    ['GET', 'canvas/api/search/topics'],
    ['GET', 'canvas/api/search/users'],
]);

it('contributor access is restricted', function ($method, $endpoint): void {
    $this->actingAs($this->contributor, 'canvas')
        ->call($method, $endpoint)
        ->assertForbidden();
})->with('protectedRoutes');

it('editor access is restricted', function ($method, $endpoint): void {
    $this->actingAs($this->editor, 'canvas')
        ->call($method, $endpoint)
        ->assertForbidden();
})->with('protectedRoutes');

it('admin access is granted', function ($method, $endpoint): void {
    $this->actingAs($this->admin, 'canvas')
        ->call($method, $endpoint)
        ->assertSuccessful();
})->with('protectedRoutes');
