<?php

use Canvas\Http\Controllers\PostController;
use Canvas\Http\Controllers\SearchController;
use Canvas\Http\Controllers\StatsController;
use Canvas\Http\Controllers\TagController;
use Canvas\Http\Controllers\TopicController;
use Canvas\Http\Controllers\UploadsController;
use Canvas\Http\Controllers\UserController;
use Canvas\Http\Controllers\ViewController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:'.config('canvas.guard')])->group(function (): void {
    Route::prefix('api')->group(function (): void {
        // Stats routes...
        Route::get('stats', StatsController::class);

        // Upload routes...
        Route::prefix('uploads')->controller(UploadsController::class)->group(function (): void {
            Route::post('/', 'store');
            Route::delete('/', 'destroy');
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
            Route::get('{user}/posts', 'posts');
            Route::get('{user}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{user}', 'destroy')->middleware(['can:manage-users']);
        });

        // Search routes...
        Route::prefix('search')->controller(SearchController::class)->group(function (): void {
            Route::get('posts', 'posts');
            Route::get('tags', 'tags')->middleware(['can:manage-taxonomy']);
            Route::get('topics', 'topics')->middleware(['can:manage-taxonomy']);
            Route::get('users', 'users')->middleware(['can:manage-users']);
        });
    });

    // Catch-all route...
    Route::get('/{view?}', ViewController::class)->where('view', '(.*)')->name('canvas');
});
