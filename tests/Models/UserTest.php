<?php

use Canvas\Models\CanvasUser;
use Canvas\Support\Gravatar;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

it('appends the default avatar to the model', function (): void {
    expect(User::factory()->create()->toArray())->toHaveKey('default_avatar');
});

it('appends the default locale to the model', function (): void {
    expect(User::factory()->create()->toArray())->toHaveKey('default_locale');
});

it('hides the password and remember token', function (): void {
    $user = User::factory()->create([
        'remember_token' => Str::random(60),
    ]);

    expect($user->toArray())->not->toHaveKey('password');
    expect($user->toArray())->not->toHaveKey('remember_token');
});

it('defines the canvas user relationship', function (): void {
    $user = User::factory()->admin()->create();

    expect($user->canvasUser())->toBeInstanceOf(HasOne::class);
    expect($user->canvasUser)->toBeInstanceOf(CanvasUser::class);
});

it('computes the contributor attribute', function (): void {
    expect(User::factory()->contributor()->create()->isContributor)->toBeTrue();
});

it('computes the editor attribute', function (): void {
    expect(User::factory()->editor()->create()->isEditor)->toBeTrue();
});

it('computes the admin attribute', function (): void {
    expect(User::factory()->admin()->create()->isAdmin)->toBeTrue();
});

it('computes the default avatar attribute', function (): void {
    $user = User::factory()->create();

    expect($user->defaultAvatar)->toBe(Gravatar::url($user->email));
});

it('computes the default locale attribute', function (): void {
    $user = User::factory()->create([
        'locale' => null,
    ]);

    expect($user->defaultLocale)->toBe(config('app.locale'));
});
