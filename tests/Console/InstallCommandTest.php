<?php

use Canvas\Models\User;

it('canvas installation command', function (): void {
    $this->artisan('canvas:install')
        ->assertExitCode(0)
        ->expectsOutput('Installation complete.');

    $this->assertDatabaseHas('canvas_users', [
        'email' => 'email@example.com',
        'role' => User::ADMIN,
    ]);
});
