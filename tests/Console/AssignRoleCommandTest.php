<?php

use Canvas\Enums\Role;
use Canvas\Tests\Models\User;

it('assigns a role by email', function (): void {
    $user = User::factory()->create();

    $this->artisan('canvas:assign-role', [
        'user' => $user->email,
        'role' => 'editor',
    ])
        ->assertExitCode(0)
        ->expectsOutput(sprintf('Assigned %s to %s.', Role::Editor->label(), $user->email));

    $this->assertDatabaseHas('canvas_users', [
        'user_id' => $user->id,
        'role' => Role::Editor->value,
    ]);
});

it('shows the previous role when changing roles', function (): void {
    $user = User::factory()->admin()->create();

    $this->artisan('canvas:assign-role', [
        'user' => $user->id,
        'role' => 'contributor',
    ])
        ->assertExitCode(0)
        ->expectsOutput(sprintf(
            'Updated %s from %s to %s.',
            $user->email,
            Role::Admin->label(),
            Role::Contributor->label(),
        ));

    $this->assertDatabaseHas('canvas_users', [
        'user_id' => $user->id,
        'role' => Role::Contributor->value,
    ]);
});

it('rejects invalid roles', function (): void {
    $user = User::factory()->create();

    $this->artisan('canvas:assign-role', [
        'user' => $user->email,
        'role' => 'boss',
    ])
        ->assertExitCode(0)
        ->expectsOutput('Please enter a valid role.');
});
