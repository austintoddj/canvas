<?php

use Canvas\Support\HostUser;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\ModelNotFoundException;

it('resolves host users by email and id', function (): void {
    $user = User::factory()->create([
        'email' => 'lookup@example.com',
    ]);

    expect(HostUser::findByIdentifier('lookup@example.com')?->getKey())->toBe($user->id)
        ->and(HostUser::findByIdentifier($user->id)?->getKey())->toBe($user->id)
        ->and(HostUser::findByIdentifier((string) $user->id)?->getKey())->toBe($user->id)
        ->and(HostUser::findByIdentifier('missing@example.com'))->toBeNull()
        ->and(HostUser::findByIdentifier(999999999))->toBeNull();
});

it('throws when resolving a missing host user', function (): void {
    HostUser::findByIdentifierOrFail('missing@example.com');
})->throws(ModelNotFoundException::class);

it('returns the configured host user model class', function (): void {
    expect(HostUser::modelClass())->toBe(User::class);
});
