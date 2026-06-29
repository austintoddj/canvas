<?php

use Canvas\Data\UserPreferences;
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

it('stores profile columns on canvas_users', function (): void {
    $user = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $user->id,
        'username' => 'writer',
        'summary' => 'Bio',
        'avatar' => 'avatar-hash',
        'website' => 'https://example.com',
        'social' => [
            'twitter' => 'writer',
        ],
        'locale' => 'en',
        'timezone' => 'America/Chicago',
    ]);

    expect($canvasUser->username)->toBe('writer');
    expect($canvasUser->summary)->toBe('Bio');
    expect($canvasUser->avatar)->toBe('avatar-hash');
    expect($canvasUser->website)->toBe('https://example.com');
    expect($canvasUser->social)->toBe([
        'twitter' => 'writer',
    ]);
    expect($canvasUser->locale)->toBe('en');
    expect($canvasUser->timezone)->toBe('America/Chicago');
});

it('casts social and preferences as arrays', function (): void {
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => User::factory()->create()->id,
        'social' => [
            'github' => 'canvas',
        ],
        'preferences' => [
            'onboarding' => [
                'complete' => true,
            ],
        ],
    ]);

    expect($canvasUser->social)->toBeArray();
    expect($canvasUser->preferences)->toBeArray();
});

it('returns an empty social links array when social is null', function (): void {
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => User::factory()->create()->id,
        'social' => null,
    ]);

    expect($canvasUser->social)->toBeNull();
    expect($canvasUser->socialLinks())->toBe([]);
});

it('resolves preferences against package defaults', function (): void {
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => User::factory()->create()->id,
        'preferences' => null,
    ]);

    expect($canvasUser->resolvedPreferences())->toBe(UserPreferences::defaults());
});

it('belongs to the host user model', function (): void {
    $user = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($canvasUser->user())->toBeInstanceOf(BelongsTo::class);
    expect($canvasUser->user)->toBeInstanceOf(User::class);
});
