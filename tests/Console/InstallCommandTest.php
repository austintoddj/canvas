<?php

use Canvas\Enums\Role;

it('runs the canvas install command', function (): void {
    $this->artisan('canvas:install')
        ->assertExitCode(0)
        ->expectsOutput('Installation complete.');

    $this->assertDatabaseHas('users', [
        'email' => 'email@example.com',
    ]);

    $this->assertDatabaseHas('canvas_users', [
        'role' => Role::Admin->value,
    ]);
});
