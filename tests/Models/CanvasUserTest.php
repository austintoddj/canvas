<?php

use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

it('casts the role and preferences', function (): void {
    $user = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $user->id,
        'role' => Role::Admin,
        'preferences' => [
            'dark_mode' => true,
            'digest' => false,
        ],
    ]);

    expect($canvasUser->role)->toBe(Role::Admin);
    expect($canvasUser->preferences)->toBe([
        'dark_mode' => true,
        'digest' => false,
    ]);
});

it('belongs to the host user model', function (): void {
    $user = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($canvasUser->user())->toBeInstanceOf(BelongsTo::class);
    expect($canvasUser->user)->toBeInstanceOf(User::class);
});
