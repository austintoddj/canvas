<?php

use Canvas\Tests\Models\User;

it('removes canvas access by email', function (): void {
    $user = User::factory()->admin()->create();

    $this->artisan('canvas:remove-access', [
        'user' => $user->email,
    ])
        ->assertExitCode(0)
        ->expectsOutputToContain(sprintf('Removed access for %s.', $user->email));

    $this->assertDatabaseMissing('canvas_users', [
        'user_id' => $user->id,
    ]);
});
