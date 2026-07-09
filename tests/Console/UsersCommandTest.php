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

    Artisan::call('canvas:users');

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

it('shows the full canvas profile by email', function (): void {
    $user = User::factory()->editor()->create([
        'name' => 'Editor User',
        'email' => 'editor@example.com',
    ]);

    $user->canvasUser->update([
        'username' => 'editor-user',
        'summary' => 'Writes things.',
        'timezone' => 'America/Chicago',
    ]);

    Artisan::call('canvas:users', ['user' => $user->email]);

    $payload = json_decode(Artisan::output(), true, 512, JSON_THROW_ON_ERROR);

    expect($payload)->toMatchArray([
        'id' => $user->id,
        'name' => 'Editor User',
        'email' => 'editor@example.com',
    ]);

    expect($payload['avatar_url'])->toBeString();
    expect($payload['canvas'])->toMatchArray([
        'role' => Role::Editor->value,
        'username' => 'editor-user',
        'summary' => 'Writes things.',
        'timezone' => 'America/Chicago',
    ]);
});

it('shows the full canvas profile by id', function (): void {
    $user = User::factory()->admin()->create();

    Artisan::call('canvas:users', ['user' => $user->id]);

    $payload = json_decode(Artisan::output(), true, 512, JSON_THROW_ON_ERROR);

    expect($payload['id'])->toBe($user->id);
    expect($payload['canvas']['role'])->toBe(Role::Admin->value);
});

it('fails when the user does not have canvas access', function (): void {
    $user = User::factory()->create([
        'email' => 'guest@example.com',
    ]);

    $this->artisan('canvas:users', [
        'user' => $user->email,
    ])
        ->assertExitCode(1)
        ->expectsOutputToContain('guest@example.com does not have Canvas access.');
});
