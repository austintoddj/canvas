<?php

dataset('adminProtectedRoutes', [
    ['GET', 'canvas/api/tags'],
    ['GET', 'canvas/api/tags/create'],
    ['GET', 'canvas/api/topics'],
    ['GET', 'canvas/api/topics/create'],
    ['GET', 'canvas/api/users'],
    ['GET', 'canvas/api/users/create'],
]);

it('restricts contributor access', function ($method, $endpoint): void {
    $this->actingAs($this->contributor, 'canvas')
        ->call($method, $endpoint)
        ->assertForbidden();
})->with('adminProtectedRoutes');

it('restricts editor access', function ($method, $endpoint): void {
    $this->actingAs($this->editor, 'canvas')
        ->call($method, $endpoint)
        ->assertForbidden();
})->with('adminProtectedRoutes');

it('grants admin access', function ($method, $endpoint): void {
    $this->actingAs($this->admin, 'canvas')
        ->call($method, $endpoint)
        ->assertSuccessful();
})->with('adminProtectedRoutes');
