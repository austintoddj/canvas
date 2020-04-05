<?php

use Illuminate\Support\Facades\Route;

Route::namespace('Canvas\Http\Controllers')->group(function () {
    Route::prefix(config('canvas.path'))->middleware(config('canvas.middleware'))->group(function () {
        Route::prefix('api')->group(function () {
            Route::get('stats', 'StatsController@index');
            Route::get('stats/{id}', 'StatsController@show');

            Route::get('posts', 'PostController@index');
            Route::get('posts/create', 'PostController@create');
            Route::post('posts', 'PostController@store');
            Route::get('posts/{id}/edit', 'PostController@edit');
            Route::post('posts/{id}', 'PostController@update');
            Route::delete('posts/{id}', 'PostController@destroy');

            Route::get('tags', 'TagController@index');
            Route::get('tags/create', 'TagController@create');
            Route::post('tags', 'TagController@store');
            Route::get('tags/{id}/edit', 'TagController@edit');
            Route::post('tags/{id}', 'TagController@update');
            Route::delete('tags/{id}', 'TagController@destroy');

            Route::get('topics', 'TopicController@index');
            Route::get('topics/create', 'TopicController@create');
            Route::post('topics', 'TopicController@store');
            Route::get('topics/{id}/edit', 'TopicController@edit');
            Route::post('topics/{id}', 'TopicController@update');
            Route::delete('topics/{id}', 'TopicController@destroy');

            Route::post('media/uploads', 'MediaController@store');
            Route::delete('media/uploads', 'MediaController@destroy');

            Route::get('settings', 'SettingsController@show');
            Route::post('settings', 'SettingsController@update');

            Route::post('locale', 'LocaleController@update');
        });

        Route::get('/{view?}', 'ViewController')->where('view', '(.*)')->name('canvas');
    });
});
