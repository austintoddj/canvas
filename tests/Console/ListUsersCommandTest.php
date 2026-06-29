<?php

use Canvas\Enums\Role;
use Canvas\Tests\Models\User;
use Illuminate\Support\Facades\Artisan;

it('lists only canvas users with their roles', function (): void {
    $admin = User::factory()->admin()->create(['name' => 'Admin User']);
    $editor = User::factory()->editor()->create(['name' => 'Editor User']);
    $guest = User::factory()->create(['name' => 'Guest User']);

    $this->artisan('canvas:list-users')
        ->assertExitCode(0)
        ->expectsOutputToContain('Admin User')
        ->expectsOutputToContain(Role::Admin->label())
        ->expectsOutputToContain('Editor User')
        ->expectsOutputToContain(Role::Editor->label())
        ->run();

    expect(Artisan::output())->not->toContain('Guest User');
});
