<?php

use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

it('casts the role and boolean preference columns', function (): void {
    $user = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $user->id,
        'role' => Role::Admin,
        'dark_mode' => true,
        'digest' => false,
    ]);

    expect($canvasUser->role)->toBe(Role::Admin);
    expect($canvasUser->dark_mode)->toBeTrue();
    expect($canvasUser->digest)->toBeFalse();
});

it('belongs to the host user model', function (): void {
    $user = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($canvasUser->user())->toBeInstanceOf(BelongsTo::class);
    expect($canvasUser->user)->toBeInstanceOf(User::class);
});
