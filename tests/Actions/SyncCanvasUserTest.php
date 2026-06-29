<?php

use Canvas\Actions\SyncCanvasUser;
use Canvas\Enums\Role;
use Canvas\Models\CanvasUser;
use Canvas\Tests\Models\User;

it('creates a canvas user when an admin assigns a role', function (): void {
    $user = User::factory()->create();
    $syncCanvasUser = new SyncCanvasUser;

    $created = $syncCanvasUser($user->id, [
        'role' => Role::Contributor->value,
        'summary' => 'Writer bio',
        'website' => 'https://example.com',
        'social' => [
            'twitter' => 'writer',
        ],
        'locale' => 'en',
        'timezone' => 'America/Chicago',
    ], true);

    expect($created)->toBeTrue();

    $this->assertDatabaseHas('canvas_users', [
        'user_id' => $user->id,
        'role' => Role::Contributor->value,
        'summary' => 'Writer bio',
        'website' => 'https://example.com',
        'locale' => 'en',
        'timezone' => 'America/Chicago',
    ]);

    expect(CanvasUser::find($user->id)->social)->toBe([
        'twitter' => 'writer',
    ]);
});

it('does not create a canvas user without a role from an admin', function (): void {
    $user = User::factory()->create();
    $syncCanvasUser = new SyncCanvasUser;

    $created = $syncCanvasUser($user->id, [
        'summary' => 'Writer bio',
    ], true);

    expect($created)->toBeFalse();
    $this->assertDatabaseMissing('canvas_users', [
        'user_id' => $user->id,
    ]);
});

it('updates an existing canvas profile', function (): void {
    $user = User::factory()->contributor()->create();
    $syncCanvasUser = new SyncCanvasUser;

    $created = $syncCanvasUser($user->id, [
        'username' => 'updated-writer',
        'website' => 'https://canvas.test',
        'timezone' => 'UTC',
    ], false);

    expect($created)->toBeFalse();

    $this->assertDatabaseHas('canvas_users', [
        'user_id' => $user->id,
        'username' => 'updated-writer',
        'website' => 'https://canvas.test',
        'timezone' => 'UTC',
    ]);
});

it('merges preferences without replacing the entire blob', function (): void {
    $user = User::factory()->contributor()->create();
    $syncCanvasUser = new SyncCanvasUser;

    $syncCanvasUser($user->id, [
        'preferences' => [
            'onboarding' => [
                'complete' => true,
            ],
        ],
    ], false);

    $canvasUser = CanvasUser::find($user->id);

    expect($canvasUser->preferences)->toBe([
        'onboarding' => [
            'complete' => true,
        ],
    ]);
});

it('normalizes empty social links to null', function (): void {
    $user = User::factory()->contributor()->create();
    $syncCanvasUser = new SyncCanvasUser;

    $syncCanvasUser($user->id, [
        'social' => [
            'twitter' => '',
            'github' => 'canvas',
        ],
    ], false);

    expect(CanvasUser::find($user->id)->social)->toBe([
        'github' => 'canvas',
    ]);

    $syncCanvasUser($user->id, [
        'social' => [
            'twitter' => '',
        ],
    ], false);

    expect(CanvasUser::find($user->id)->social)->toBeNull();
});

it('does not change the host user record', function (): void {
    $user = User::factory()->contributor()->create();
    $originalName = $user->name;
    $originalEmail = $user->email;
    $syncCanvasUser = new SyncCanvasUser;

    $syncCanvasUser($user->id, [
        'summary' => 'Only Canvas data',
        'website' => 'https://example.com',
    ], false);

    $fresh = $user->fresh();

    expect($fresh->name)->toBe($originalName);
    expect($fresh->email)->toBe($originalEmail);
});
