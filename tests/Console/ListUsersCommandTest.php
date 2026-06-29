<?php

use Canvas\Enums\Role;
use Canvas\Tests\Models\User;
use Illuminate\Support\Facades\Artisan;

it('lists only canvas users with their roles', function (): void {
    $admin = User::factory()->admin()->create(['name' => 'Admin User']);
    $editor = User::factory()->editor()->create(['name' => 'Editor User']);
    $guest = User::factory()->create(['name' => 'Guest User']);

    $admin->canvasUser->update([
        'username' => 'canvas-admin',
        'locale' => 'en',
        'timezone' => 'America/Chicago',
    ]);

    $editor->canvasUser->update([
        'username' => 'editor-user',
        'locale' => 'en',
        'timezone' => 'UTC',
    ]);

    $this->assertDatabaseHas('canvas_users', [
        'user_id' => $admin->id,
        'username' => 'canvas-admin',
        'timezone' => 'America/Chicago',
    ]);

    Artisan::call('canvas:list-users');

    $output = Artisan::output();

    expect($output)
        ->toContain('Admin User')
        ->toContain(Role::Admin->label())
        ->toContain('canvas-admin')
        ->toContain('America/Chicago')
        ->toContain('Editor User')
        ->toContain(Role::Editor->label())
        ->toContain('editor-user')
        ->not->toContain('Guest User');
});
