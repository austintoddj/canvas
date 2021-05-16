<?php

use Canvas\Http\Controllers\PostController;
use Canvas\Http\Controllers\SearchController;
use Canvas\Http\Controllers\TagController;
use Canvas\Http\Controllers\TopicController;
use Canvas\Http\Controllers\TrafficController;
use Canvas\Http\Controllers\UploadsController;
use Canvas\Http\Controllers\UserController;
use Canvas\Http\Controllers\ViewController;
use Canvas\Http\Middleware\AuthenticateSession;
use Canvas\Http\Middleware\VerifyAdmin;
use Illuminate\Support\Facades\Route;

Route::middleware([AuthenticateSession::class])->group(function () {
    Route::prefix('api')->group(function () {
        // Traffic routes...
        Route::prefix('traffic')->group(function () {
            Route::get('views', [TrafficController::class, 'views'])->name('canvas.traffic.views');
            Route::get('visits', [TrafficController::class, 'visits'])->name('canvas.traffic.visits');
            Route::get('chart', [TrafficController::class, 'chart'])->name('canvas.traffic.chart');
            Route::get('sources', [TrafficController::class, 'sources'])->name('canvas.traffic.sources');
            Route::get('pages', [TrafficController::class, 'pages'])->name('canvas.traffic.pages');
            Route::get('countries', [TrafficController::class, 'countries'])->name('canvas.traffic.countries');
            Route::get('devices', [TrafficController::class, 'devices'])->name('canvas.traffic.devices');
        });

        // Post routes...
        Route::prefix('posts')->group(function () {
            Route::get('/', [PostController::class, 'index'])->name('canvas.posts.index');
            Route::get('create', [PostController::class, 'create'])->name('canvas.posts.create');
            Route::get('{id}', [PostController::class, 'show'])->name('canvas.posts.show');
            Route::post('{id}', [PostController::class, 'store'])->name('canvas.posts.store');
            Route::delete('{id}', [PostController::class, 'destroy'])->name('canvas.posts.destroy');
        });

        // Tag routes...
        Route::prefix('tags')->middleware([VerifyAdmin::class])->group(function () {
            Route::get('/', [TagController::class, 'index'])->name('canvas.tags.index');
            Route::get('create', [TagController::class, 'create'])->name('canvas.tags.create');
            Route::get('{id}', [TagController::class, 'show'])->name('canvas.tags.show');
            Route::get('{id}/posts', [TagController::class, 'posts'])->name('canvas.tags.posts');
            Route::post('{id}', [TagController::class, 'store'])->name('canvas.tags.store');
            Route::delete('{id}', [TagController::class, 'destroy'])->name('canvas.tags.destroy');
        });

        // Topic routes...
        Route::prefix('topics')->middleware([VerifyAdmin::class])->group(function () {
            Route::get('/', [TopicController::class, 'index'])->name('canvas.topics.index');
            Route::get('create', [TopicController::class, 'create'])->name('canvas.topics.create');
            Route::get('{id}', [TopicController::class, 'show'])->name('canvas.topics.show');
            Route::get('{id}/posts', [TopicController::class, 'posts'])->name('canvas.topics.posts');
            Route::post('{id}', [TopicController::class, 'store'])->name('canvas.topics.store');
            Route::delete('{id}', [TopicController::class, 'destroy'])->name('canvas.topics.destroy');
        });

        // User routes...
        Route::prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index'])->middleware([VerifyAdmin::class])->name('canvas.users.index');
            Route::get('create', [UserController::class, 'create'])->middleware([VerifyAdmin::class])->name('canvas.users.create');
            Route::get('{id}', [UserController::class, 'show'])->name('canvas.users.show');
            Route::get('{id}/posts', [UserController::class, 'posts'])->name('canvas.users.posts');
            Route::post('{id}', [UserController::class, 'store'])->name('canvas.users.store');
            Route::delete('{id}', [UserController::class, 'destroy'])->middleware([VerifyAdmin::class])->name('canvas.users.destroy');
        });

        // Upload routes...
        Route::prefix('uploads')->group(function () {
            Route::post('/', [UploadsController::class, 'store'])->name('canvas.uploads.store');
            Route::delete('/', [UploadsController::class, 'destroy'])->name('canvas.uploads.destroy');
        });

        // Search routes...
        Route::prefix('search')->group(function () {
            Route::get('posts', [SearchController::class, 'posts'])->name('canvas.search.posts');
            Route::get('tags', [SearchController::class, 'tags'])->middleware([VerifyAdmin::class])->name('canvas.search.tags');
            Route::get('topics', [SearchController::class, 'topics'])->middleware([VerifyAdmin::class])->name('canvas.search.topics');
            Route::get('users', [SearchController::class, 'users'])->middleware([VerifyAdmin::class])->name('canvas.search.users');
        });
    });

    // Catch-all route...
    Route::get('/{view?}', [ViewController::class, 'index'])->where('view', '(.*)')->name('canvas');
});
