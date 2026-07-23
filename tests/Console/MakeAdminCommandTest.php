<?php

use Canvas\Enums\Role;
use Canvas\Tests\Models\User;

it('makes a user an admin by id', function (): void {
    $user = User::factory()->editor()->create();

    $this->artisan('canvas:make-admin', [
        'user' => $user->id,
    ])
        ->assertExitCode(0)
        ->expectsOutputToContain(sprintf(
            'Updated %s from %s to Admin.',
            $user->email,
            Role::Editor->label(),
        ));

    $this->assertDatabaseHas('canvas_users', [
        'user_id' => $user->id,
        'role' => Role::Admin->value,
    ]);
});

it('assigns admin to a host user without prior canvas access', function (): void {
    $user = User::factory()->create();

    $this->artisan('canvas:make-admin', [
        'user' => $user->email,
    ])
        ->assertExitCode(0)
        ->expectsOutputToContain(sprintf('Assigned Admin to %s.', $user->email));

    $this->assertDatabaseHas('canvas_users', [
        'user_id' => $user->id,
        'role' => Role::Admin->value,
    ]);
});
