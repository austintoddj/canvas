<?php

use Canvas\Http\Middleware\EagerLoadCanvasUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

it('eager loads the canvas user relationship for authenticated requests', function (): void {
    $user = $this->contributor;
    $middleware = new EagerLoadCanvasUser;

    $request = Request::create('/canvas/api/posts', 'GET');
    $request->setUserResolver(fn () => $user);

    $middleware->handle($request, fn (Request $request) => response('ok'));

    expect($user->relationLoaded('canvasUser'))->toBeTrue();
    expect($user->canvasUser)->not->toBeNull();
});

it('does nothing when there is no authenticated user', function (): void {
    $middleware = new EagerLoadCanvasUser;
    $request = Request::create('/canvas/api/posts', 'GET');

    $response = $middleware->handle($request, fn (Request $request) => response('ok'));

    expect($response->getContent())->toBe('ok');
});

it('does nothing for user models without a canvas user relationship', function (): void {
    $user = new class
    {
        public function getAuthIdentifier(): string
        {
            return 'guest';
        }
    };

    $middleware = new EagerLoadCanvasUser;
    $request = Request::create('/canvas/api/posts', 'GET');
    $request->setUserResolver(fn () => $user);

    $middleware->handle($request, fn (Request $request) => response('ok'));

    expect(true)->toBeTrue();
});

it('issues a single canvas user query for the canvas shell', function (): void {
    $contributor = $this->contributor;
    $queries = 0;

    DB::listen(function ($query) use (&$queries): void {
        if (str_contains($query->sql, 'canvas_users')) {
            $queries++;
        }
    });

    $this->actingAs($contributor, 'canvas')
        ->get(config('canvas.path'))
        ->assertSuccessful();

    expect($queries)->toBe(1);
});
