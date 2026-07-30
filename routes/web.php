<?php

use Canvas\Http\Controllers\AiRewriteController;
use Canvas\Http\Controllers\IntegrationsController;
use Canvas\Http\Controllers\MediaController;
use Canvas\Http\Controllers\PostController;
use Canvas\Http\Controllers\PostRevisionController;
use Canvas\Http\Controllers\SearchController;
use Canvas\Http\Controllers\StatsController;
use Canvas\Http\Controllers\TagController;
use Canvas\Http\Controllers\TopicController;
use Canvas\Http\Controllers\TranslationsController;
use Canvas\Http\Controllers\UnsplashController;
use Canvas\Http\Controllers\UserController;
use Canvas\Http\Controllers\ViewController;
use Canvas\Http\Middleware\Authorize;
use Canvas\Http\Middleware\EagerLoadCanvasUser;
use Illuminate\Support\Facades\Route;

Route::middleware([
    'auth:'.config('canvas.guard'),
    EagerLoadCanvasUser::class,
    Authorize::class,
])->group(function (): void {
    Route::prefix('api')->group(function (): void {
        Route::get('stats', StatsController::class);

        Route::get('translations/{locale}', TranslationsController::class);

        Route::get('unsplash', UnsplashController::class);

        Route::post('ai/rewrite', AiRewriteController::class)->middleware('throttle:30,1');

        Route::prefix('integrations')->middleware(['can:manage-integrations'])->group(function (): void {
            Route::get('/', [IntegrationsController::class, 'show']);
            Route::put('/', [IntegrationsController::class, 'update']);
            Route::post('webhooks/test', [IntegrationsController::class, 'testWebhook'])
                ->middleware('throttle:10,1');
        });

        Route::prefix('media')->controller(MediaController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::get('create', 'create');
            Route::get('{media}', 'show');
            Route::post('{id}', 'store');
            Route::put('{media}', 'update');
            Route::delete('{media}', 'destroy');
        });

        Route::prefix('posts')->controller(PostController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::get('create', 'create');
            Route::get('{post}/stats', 'stats');
            Route::get('{post}/revisions', [PostRevisionController::class, 'index']);
            Route::post('{post}/revisions', [PostRevisionController::class, 'store']);
            Route::get('{post}/revisions/{revision}', [PostRevisionController::class, 'show']);
            Route::put('{post}/revisions/{revision}', [PostRevisionController::class, 'update']);
            Route::post('{post}/revisions/{revision}/restore', [PostRevisionController::class, 'restore']);
            Route::get('{post}', 'show');
            Route::post('{post}/discard', 'discard');
            Route::post('{id}', 'store');
            Route::delete('{post}', 'destroy');
        });

        Route::prefix('tags')->middleware(['can:manage-taxonomy'])->controller(TagController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::get('create', 'create');
            Route::get('{tag}/posts', 'posts');
            Route::get('{tag}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{tag}', 'destroy');
        });

        Route::prefix('topics')->middleware(['can:manage-taxonomy'])->controller(TopicController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::get('create', 'create');
            Route::get('{topic}/posts', 'posts');
            Route::get('{topic}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{topic}', 'destroy');
        });

        Route::prefix('users')->controller(UserController::class)->group(function (): void {
            Route::get('/', 'index')->middleware(['can:manage-users']);
            Route::get('create', 'create')->middleware(['can:manage-users']);
            Route::get('lookup', 'lookup')->middleware(['can:manage-users']);
            Route::get('{user}/posts', 'posts');
            Route::get('{user}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{user}', 'destroy')->middleware(['can:manage-users']);
        });

        Route::get('search', [SearchController::class, 'index']);
    });

    Route::get('/{view?}', ViewController::class)->where('view', '(.*)')->name('canvas');
});
