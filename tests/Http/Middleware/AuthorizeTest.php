<?php

use Canvas\Enums\Role;
use Canvas\Http\Middleware\Authorize;
use Canvas\Models\CanvasUser;
use Canvas\Tests\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

it('forbids authenticated users without canvas access', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user, 'canvas')
        ->getJson('canvas/api/posts')
        ->assertForbidden();
});

it('allows authenticated users with canvas access', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->getJson('canvas/api/posts')
        ->assertSuccessful();
});

it('forbids requests with no authenticated user', function (): void {
    $request = Request::create('/canvas/api/posts', 'GET');

    try {
        (new Authorize)->handle($request, fn () => response('ok'));
        expect(false)->toBeTrue('Expected 403 for unauthenticated requests.');
    } catch (HttpException $exception) {
        expect($exception->getStatusCode())->toBe(403);
    }
});

it('allows bare host users that have a canvas_users row', function (): void {
    useBareUserModel();

    $host = User::factory()->create();
    CanvasUser::factory()->create([
        'user_id' => $host->id,
        'role' => Role::Contributor,
    ]);

    $this->actingAs(bareUser($host->id), 'canvas')
        ->getJson('canvas/api/posts')
        ->assertSuccessful();
});

it('forbids bare host users without a canvas_users row', function (): void {
    useBareUserModel();

    $host = User::factory()->create();

    $this->actingAs(bareUser($host->id), 'canvas')
        ->getJson('canvas/api/posts')
        ->assertForbidden();
});

it('authorizes bare hosts from the eager-loaded canvasUser relation without a second query', function (): void {
    useBareUserModel();

    $host = User::factory()->create();
    $canvasUser = CanvasUser::factory()->create([
        'user_id' => $host->id,
        'role' => Role::Contributor,
    ]);

    $bareUser = bareUser($host->id);
    $bareUser->setRelation('canvasUser', $canvasUser);

    $request = Request::create('/canvas/api/posts', 'GET');
    $request->setUserResolver(fn () => $bareUser);

    $response = (new Authorize)->handle($request, fn () => response('ok'));

    expect($response->getContent())->toBe('ok');
});
