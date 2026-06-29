<?php

use Canvas\Enums\Role;
use Canvas\Tests\Models\User;
use Illuminate\Support\Facades\Artisan;

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

    Artisan::call('canvas:show-user', ['user' => $user->email]);

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

    Artisan::call('canvas:show-user', ['user' => $user->id]);

    $payload = json_decode(Artisan::output(), true, 512, JSON_THROW_ON_ERROR);

    expect($payload['id'])->toBe($user->id);
    expect($payload['canvas']['role'])->toBe(Role::Admin->value);
});

it('fails when the user does not have canvas access', function (): void {
    $user = User::factory()->create([
        'email' => 'guest@example.com',
    ]);

    $this->artisan('canvas:show-user', [
        'user' => $user->email,
    ])
        ->assertExitCode(1)
        ->expectsOutputToContain('guest@example.com does not have Canvas access.');
});
