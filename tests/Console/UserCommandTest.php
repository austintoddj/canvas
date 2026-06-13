<?php

use Canvas\Models\User;

it('canvas user command will validate an empty email', function (): void {
    $this->artisan('canvas:user admin')
        ->assertExitCode(0)
        ->expectsOutput('Please enter a valid email.');
});
it('canvas user command will validate an invalid email', function (): void {
    $this->artisan('canvas:user admin --email bad.email')
        ->assertExitCode(0)
        ->expectsOutput('Please enter a valid email.');
});
it('canvas user command will validate an invalid role', function (): void {
    $this->artisan('canvas:user ad --email email@example.com')
        ->assertExitCode(0)
        ->expectsOutput('Please enter a valid role.');
});
it('canvas user command can create a new contributor', function (): void {
    $this->artisan('canvas:user contributor --email contributor@example.com')
        ->assertExitCode(0)
        ->expectsOutput('New user created.');

    $this->assertDatabaseHas('canvas_users', [
        'email' => 'contributor@example.com',
        'role' => User::CONTRIBUTOR,
    ]);
});
it('canvas user command can create a new editor', function (): void {
    $this->artisan('canvas:user editor --email editor@example.com')
        ->assertExitCode(0)
        ->expectsOutput('New user created.');

    $this->assertDatabaseHas('canvas_users', [
        'email' => 'editor@example.com',
        'role' => User::EDITOR,
    ]);
});
it('canvas user command can create a new admin', function (): void {
    $this->artisan('canvas:user admin --email admin@example.com')
        ->assertExitCode(0)
        ->expectsOutput('New user created.');

    $this->assertDatabaseHas('canvas_users', [
        'email' => 'admin@example.com',
        'role' => User::ADMIN,
    ]);
});
