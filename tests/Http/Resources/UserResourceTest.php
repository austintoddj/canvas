<?php

use Canvas\Http\Resources\CanvasUserResource;
use Canvas\Http\Resources\UserResource;
use Canvas\Tests\Models\User;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

it('transforms a host user with nested canvas data', function (): void {
    $user = User::factory()->contributor()->create([
        'name' => 'Writer',
        'email' => 'writer@example.com',
    ]);

    $user->canvasUser->update([
        'username' => 'writer',
        'summary' => 'Bio',
        'avatar' => 'https://cdn.example.com/writer.jpg',
        'website' => 'https://example.com',
        'social' => ['x' => 'writer'],
    ]);

    $payload = UserResource::make($user->load('canvasUser'))->resolve();

    expect($payload)->toMatchArray([
        'id' => $user->id,
        'name' => 'Writer',
        'email' => 'writer@example.com',
        'avatar_url' => 'https://cdn.example.com/writer.jpg',
    ]);

    expect($payload['canvas'])->toMatchArray([
        'role' => 1,
        'username' => 'writer',
        'summary' => 'Bio',
        'avatar' => 'https://cdn.example.com/writer.jpg',
        'avatar_url' => 'https://cdn.example.com/writer.jpg',
        'website' => 'https://example.com',
        'social' => ['x' => 'writer'],
        'theme' => 'system',
        'digest' => true,
    ]);
    expect($payload['canvas']['updated_at'])->toBeString();
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
        'theme' => 'system',
        'digest' => false,
        'preferences' => [],
    ]);
});

it('serializes a canvas user resource instance', function (): void {
    $user = User::factory()->contributor()->create([
        'email' => 'resource@example.com',
    ]);
    $user->canvasUser->update(['avatar' => 'https://cdn.example.com/resource.jpg']);

    $payload = CanvasUserResource::make($user->canvasUser->fresh())->resolve();

    expect($payload['username'])->toBe($user->canvasUser->username)
        ->and($payload['role'])->toBe(1)
        ->and($payload['avatar_url'])->toBe('https://cdn.example.com/resource.jpg');
});

it('returns defaults when profile array receives a null canvas user', function (): void {
    expect(CanvasUserResource::toProfileArray(null))
        ->toBe(CanvasUserResource::defaults());
});

it('aborts when the host user is missing from a canvas user resource', function (): void {
    $user = User::factory()->contributor()->create();
    $canvasUser = $user->canvasUser;
    $canvasUser->setRelation('user', null);

    UserResource::hostUserFromCanvasUser($canvasUser);
})->throws(NotFoundHttpException::class);
