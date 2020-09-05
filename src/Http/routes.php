<?php

use Canvas\Http\Middleware\Admin;
use Canvas\Http\Middleware\Authorize;
use Illuminate\Support\Facades\Route;

Route::domain(config('canvas.domain'))->prefix(config('canvas.path'))->middleware(config('canvas.middleware'))->namespace('Canvas\Http\Controllers')->group(function () {

         // Authentication routes...
    Route::namespace('Auth')->group(function () {
        Route::prefix('login')->group(function () {
            Route::get('/', 'LoginController@showLoginForm')->name('canvas.login');
            Route::post('/', 'LoginController@login');
        });

        Route::prefix('password')->group(function () {
            Route::get('reset', 'ForgotPasswordController@showLinkRequestForm');
            Route::post('email', 'ForgotPasswordController@sendResetLinkEmail');
            Route::get('reset/{token}', 'ResetPasswordController@showResetForm');
            Route::post('reset', 'ResetPasswordController@reset');
        });

        Route::get('logout', 'LoginController@logout')->name('canvas.logout');
    });

    // API routes...
    Route::middleware(Authorize::class)->group(function () {
        Route::prefix('api')->group(function () {
            Route::prefix('uploads')->group(function () {
                Route::post('/', 'UploadsController@store');
                Route::delete('/', 'UploadsController@destroy');
            });

            Route::prefix('posts')->group(function () {
                Route::get('/', 'PostController@index');
                Route::get('create', 'PostController@create');
                Route::get('{id}', 'PostController@show');
                Route::post('{id}', 'PostController@store');
                Route::delete('{id}', 'PostController@destroy');
            });

            Route::prefix('stats')->group(function () {
                Route::get('/', 'StatsController@index');
                Route::get('{id}', 'StatsController@show');
            });

            Route::prefix('tags')->middleware([Admin::class])->group(function () {
                Route::get('/', 'TagController@index');
                Route::get('create', 'TagController@create');
                Route::get('{id}', 'TagController@show');
                Route::get('{id}/posts', 'TagController@showPosts');
                Route::post('{id}', 'TagController@store');
                Route::delete('{id}', 'TagController@destroy');
            });

            Route::prefix('topics')->middleware([Admin::class])->group(function () {
                Route::get('/', 'TopicController@index');
                Route::get('create', 'TopicController@create');
                Route::get('{id}', 'TopicController@show');
                Route::get('{id}/posts', 'TopicController@showPosts');
                Route::post('{id}', 'TopicController@store');
                Route::delete('{id}', 'TopicController@destroy');
            });

            Route::prefix('users')->group(function () {
                Route::get('/', 'UserController@index')->middleware([Admin::class]);
                Route::get('create', 'UserController@create')->middleware([Admin::class]);
                Route::get('{id}', 'UserController@show');
                Route::get('{id}/posts', 'UserController@showPosts');
                Route::post('{id}', 'UserController@store');
                Route::delete('{id}', 'UserController@destroy')->middleware([Admin::class]);
            });

            Route::prefix('search')->group(function () {
                Route::get('posts', 'SearchController@showPosts');
                Route::get('tags', 'SearchController@showTags')->middleware([Admin::class]);
                Route::get('topics', 'SearchController@showTopics')->middleware([Admin::class]);
                Route::get('users', 'SearchController@showUsers')->middleware([Admin::class]);
            });
        });

        // Catch-all route...
        Route::get('/{view?}', 'HomeController@index')->where('view', '(.*)')->name('canvas');
    });
});
