<?php

use Canvas\Models\CanvasUser;
use Canvas\Support\Gravatar;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

it('appends the default avatar to the model', function (): void {
    expect(User::factory()->create()->toArray())->toHaveKey('default_avatar');
});

it('appends the default locale to the model', function (): void {
    expect(User::factory()->contributor()->create()->toArray())->toHaveKey('default_locale');
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

it('defines content ownership relationships from HasCanvasAccess', function (): void {
    $user = User::factory()->contributor()->create();

    expect($user->posts())->toBeInstanceOf(HasMany::class)
        ->and($user->tags())->toBeInstanceOf(HasMany::class)
        ->and($user->topics())->toBeInstanceOf(HasMany::class);
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

it('computes profile attributes from canvas_users', function (): void {
    $user = User::factory()->contributor()->create();

    expect($user->username)->toBe($user->canvasUser->username);
    expect($user->summary)->toBe($user->canvasUser->summary);
    expect($user->avatar)->toBe($user->canvasUser->avatar);
    expect($user->locale)->toBe($user->canvasUser->locale);
});

it('computes the default locale attribute from canvas_users', function (): void {
    $user = User::factory()->contributor()->create();

    CanvasUser::query()->where('user_id', $user->id)->update(['locale' => null]);

    $user->refresh();

    expect($user->defaultLocale)->toBe(config('app.locale'));
});
