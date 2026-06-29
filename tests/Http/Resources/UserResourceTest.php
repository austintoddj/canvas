<?php

use Canvas\Http\Resources\CanvasUserResource;
use Canvas\Http\Resources\UserResource;
use Canvas\Tests\Models\User;

it('transforms a host user with nested canvas data', function (): void {
    $user = User::factory()->contributor()->create([
        'name' => 'Writer',
        'email' => 'writer@example.com',
    ]);

    $user->canvasUser->update([
        'username' => 'writer',
        'summary' => 'Bio',
        'website' => 'https://example.com',
        'social' => ['twitter' => 'writer'],
    ]);

    $payload = UserResource::make($user->load('canvasUser'))->resolve();

    expect($payload)->toMatchArray([
        'id' => $user->id,
        'name' => 'Writer',
        'email' => 'writer@example.com',
    ]);

    expect($payload['avatar_url'])->toBeString();
    expect($payload['canvas'])->toMatchArray([
        'role' => 1,
        'username' => 'writer',
        'summary' => 'Bio',
        'website' => 'https://example.com',
        'social' => ['twitter' => 'writer'],
        'dark_mode' => false,
        'digest' => true,
    ]);
});

it('omits canvas when the relationship is not loaded', function (): void {
    $user = User::factory()->create();

    $payload = UserResource::make($user)->resolve();

    expect($payload)->not->toHaveKey('canvas');
});

it('exposes canvas defaults for create forms', function (): void {
    expect(CanvasUserResource::defaults())->toMatchArray([
        'role' => null,
        'username' => null,
        'locale' => config('app.fallback_locale'),
        'timezone' => config('app.timezone'),
        'dark_mode' => false,
        'digest' => false,
        'preferences' => [
            'onboarding' => [
                'complete' => false,
            ],
        ],
    ]);
});
