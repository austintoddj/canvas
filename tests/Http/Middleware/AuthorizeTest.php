<?php

use Canvas\Tests\Models\User;

it('forbids authenticated users without canvas access', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user, 'canvas')
        ->getJson('canvas/api/posts')
        ->assertForbidden();
});

it('allows authenticated users with canvas access', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->getJson('canvas/api/posts')
        ->assertSuccessful();
});
