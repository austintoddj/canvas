<?php

use Canvas\Http\Controllers\Auth\AuthenticatedSessionController;
use Canvas\Http\Controllers\Auth\NewPasswordController;
use Canvas\Http\Controllers\Auth\PasswordResetLinkController;
use Canvas\Http\Controllers\PostController;
use Canvas\Http\Controllers\SearchController;
use Canvas\Http\Controllers\StatsController;
use Canvas\Http\Controllers\TagController;
use Canvas\Http\Controllers\TopicController;
use Canvas\Http\Controllers\UploadsController;
use Canvas\Http\Controllers\UserController;
use Canvas\Http\Controllers\ViewController;
use Canvas\Http\Middleware\Admin;
use Canvas\Http\Middleware\Authenticate;
use Illuminate\Support\Facades\Route;

Route::controller(AuthenticatedSessionController::class)->group(function (): void {
    // Login routes...
    Route::get('login', 'create')->name('canvas.login');
    Route::post('login', 'store');

    // Logout routes...
    Route::post('logout', 'destroy')->name('canvas.logout');
});

Route::controller(PasswordResetLinkController::class)->group(function (): void {
    // Forgot password routes...
    Route::get('forgot-password', 'create')->name('canvas.password.request');
    Route::post('forgot-password', 'store')->name('canvas.password.email');
});

Route::controller(NewPasswordController::class)->group(function (): void {
    // Reset password routes...
    Route::get('reset-password/{token}', 'create')->name('canvas.password.reset');
    Route::post('reset-password', 'store')->name('canvas.password.update');
});

Route::middleware([Authenticate::class])->group(function (): void {
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
        Route::prefix('tags')->middleware([Admin::class])->controller(TagController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::get('create', 'create');
            Route::get('{tag}/posts', 'posts');
            Route::get('{tag}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{tag}', 'destroy');
        });

        // Topic routes...
        Route::prefix('topics')->middleware([Admin::class])->controller(TopicController::class)->group(function (): void {
            Route::get('/', 'index');
            Route::get('create', 'create');
            Route::get('{topic}/posts', 'posts');
            Route::get('{topic}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{topic}', 'destroy');
        });

        // User routes...
        Route::prefix('users')->controller(UserController::class)->group(function (): void {
            Route::get('/', 'index')->middleware([Admin::class]);
            Route::get('create', 'create')->middleware([Admin::class]);
            Route::get('{user}/posts', 'posts');
            Route::get('{user}', 'show');
            Route::post('{id}', 'store');
            Route::delete('{user}', 'destroy')->middleware([Admin::class]);
        });

        // Search routes...
        Route::prefix('search')->controller(SearchController::class)->group(function (): void {
            Route::get('posts', 'posts');
            Route::get('tags', 'tags')->middleware([Admin::class]);
            Route::get('topics', 'topics')->middleware([Admin::class]);
            Route::get('users', 'users')->middleware([Admin::class]);
        });
    });

    // Catch-all route...
    Route::get('/{view?}', ViewController::class)->where('view', '(.*)')->name('canvas');
});
