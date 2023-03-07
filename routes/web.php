<?php

declare(strict_types=1);

use Canvas\Http\Controllers\ImageController;
use Canvas\Http\Controllers\PostController;
use Canvas\Http\Controllers\SearchController;
use Canvas\Http\Controllers\StatController;
use Canvas\Http\Controllers\TagController;
use Canvas\Http\Controllers\TopicController;
use Canvas\Http\Controllers\UserController;
use Canvas\Http\Controllers\ViewController;
use Canvas\Http\Middleware\AuthenticateSession;
use Canvas\Http\Middleware\VerifyAdmin;
use Illuminate\Support\Facades\Route;

Route::middleware([AuthenticateSession::class])->group(function () {
    Route::prefix('api')->as('canvas.')->group(function () {
        Route::prefix('posts')
            ->controller(PostController::class)
            ->as('posts.')
            ->group(function () {
                Route::get('/', 'index')->name('index');
                Route::get('create', 'create')->name('create');
                Route::get('{id}', 'show')->name('show');
                Route::get('{id}/stats', 'stats')->name('stats');
                Route::put('{id}', 'store')->name('store');
                Route::delete('{id}', 'destroy')->name('destroy');
            });

        Route::middleware([VerifyAdmin::class])->group(function () {
            Route::prefix('tags')
                ->controller(TagController::class)
                ->as('tags.')
                ->group(function () {
                    Route::get('/', 'index')->name('index');
                    Route::get('create', 'create')->name('create');
                    Route::get('{id}', 'show')->name('show');
                    Route::get('{id}/posts', 'posts')->name('posts');
                    Route::put('{id}', 'store')->name('store');
                    Route::delete('{id}', 'destroy')->name('destroy');
                });

            Route::prefix('topics')
                ->controller(TopicController::class)
                ->as('topics.')
                ->group(function () {
                    Route::get('/', 'index')->name('index');
                    Route::get('create', 'create')->name('create');
                    Route::get('{id}', 'show')->name('show');
                    Route::get('{id}/posts', 'posts')->name('posts');
                    Route::put('{id}', 'store')->name('store');
                    Route::delete('{id}', 'destroy')->name('destroy');
                });
        });

        Route::prefix('users')
            ->controller(UserController::class)
            ->as('users.')
            ->group(function () {
                Route::middleware([VerifyAdmin::class])->group(function () {
                    Route::get('/', 'index')->name('index');
                    Route::get('create', 'create')->name('create');
                    Route::get('{id}/posts', 'posts')->name('posts');
                    Route::delete('{id}', 'destroy')->name('destroy');
                });

                Route::get('{id}', 'show')->name('show');
                Route::put('{id}', 'store')->name('store');
            });

        Route::prefix('images')
            ->controller(ImageController::class)
            ->as('images.')
            ->group(function () {
                Route::put('/', 'store')->name('store');
                Route::delete('/', 'destroy')->name('destroy');
            });

        Route::prefix('search')
            ->controller(SearchController::class)
            ->as('search.')
            ->group(function () {
                Route::get('posts', 'posts')->name('posts');

                Route::middleware([VerifyAdmin::class])->group(function () {
                    Route::get('tags', 'tags')->name('tags');
                    Route::get('topics', 'topics')->name('topics');
                    Route::get('users', 'users')->name('users');
                });
            });

        Route::prefix('stats')
            ->controller(StatController::class)
            ->as('stats.')
            ->group(function () {
                Route::get('views', 'views')->name('views');
                Route::get('visits', 'visits')->name('visits');
                Route::get('chart', 'chart')->name('chart');
                Route::get('sources', 'sources')->name('sources');
                Route::get('pages', 'pages')->name('pages');
                Route::get('countries', 'countries')->name('countries');
                Route::get('devices', 'devices')->name('devices');
            });
    });

    Route::get('/{view?}', [ViewController::class, 'index'])->where('view', '(.*)')->name('canvas');
});
