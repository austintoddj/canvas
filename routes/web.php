<?php

use Canvas\Http\Controllers\AiRewriteController;
use Canvas\Http\Controllers\IntegrationSettingsController;
use Canvas\Http\Controllers\MediaController;
use Canvas\Http\Controllers\PostController;
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
        // Stats routes...
        Route::get('stats', StatsController::class);

        // Translations routes...
        Route::get('translations/{locale}', TranslationsController::class);

        // Unsplash routes...
        Route::get('unsplash', UnsplashController::class);

        // AI writing (any Canvas user)...
        Route::post('ai/rewrite', AiRewriteController::class)->middleware('throttle:30,1');

        // Integration settings (admin)...
        Route::prefix('settings/integrations')->middleware(['can:manage-settings'])->group(function (): void {
            Route::get('/', [IntegrationSettingsController::class, 'show']);
            Route::put('/', [IntegrationSettingsController::class, 'update']);
        });

        // Media routes...
        Route::prefix('media')->controller(MediaController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::get('create', 'create');
            Route::get('{media}', 'show');
            Route::post('{id}', 'store');
            Route::put('{media}', 'update');
            Route::delete('{media}', 'destroy');
        });

        // Post routes...
        Route::prefix('posts')->controller(PostController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::get('create', 'create');
            Route::get('{post}/stats', 'stats');
            Route::get('{post}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{post}', 'destroy');
        });

        // Tag routes...
        Route::prefix('tags')->middleware(['can:manage-taxonomy'])->controller(TagController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::get('create', 'create');
            Route::get('{tag}/posts', 'posts');
            Route::get('{tag}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{tag}', 'destroy');
        });

        // Topic routes...
        Route::prefix('topics')->middleware(['can:manage-taxonomy'])->controller(TopicController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::get('create', 'create');
            Route::get('{topic}/posts', 'posts');
            Route::get('{topic}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{topic}', 'destroy');
        });

        // User routes...
        Route::prefix('users')->controller(UserController::class)->group(function (): void {
            Route::get('/', 'index')->middleware(['can:manage-users']);
            Route::get('create', 'create')->middleware(['can:manage-users']);
            Route::get('lookup', 'lookup')->middleware(['can:manage-users']);
            Route::get('{user}/posts', 'posts');
            Route::get('{user}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{user}', 'destroy')->middleware(['can:manage-users']);
        });

        // Search routes...
        Route::get('search', [SearchController::class, 'index']);
    });

    // Catch-all route...
    Route::get('/{view?}', ViewController::class)->where('view', '(.*)')->name('canvas');
});
