<?php

use Illuminate\Support\Facades\Route;

// Stats routes...
Route::get('/', 'StatsController@index')->name('canvas.index');
Route::get('stats/{id}', 'StatsController@show')->name('canvas.stats.show');

// Post routes...
Route::get('posts', 'PostController@index')->name('canvas.post.index');
Route::get('posts/create', 'PostController@create')->name('canvas.post.create');
Route::post('posts', 'PostController@store')->name('canvas.post.store');
Route::get('posts/{id}/edit', 'PostController@edit')->name(('canvas.post.edit'));
Route::put('posts/{id}', 'PostController@update')->name('canvas.post.update');
Route::delete('posts/{id}', 'PostController@destroy')->name('canvas.post.destroy');

// Media routes...
Route::post('media/uploads', 'MediaController@store')->name('canvas.media.store');

// Tag routes...
Route::get('tags', 'TagController@index')->name('canvas.tag.index');
Route::get('tags/create', 'TagController@create')->name('canvas.tag.create');
Route::post('tags', 'TagController@store')->name('canvas.tag.store');
Route::get('tags/{id}/edit', 'TagController@edit')->name(('canvas.tag.edit'));
Route::put('tags/{id}', 'TagController@update')->name('canvas.tag.update');
Route::delete('tags/{id}', 'TagController@destroy')->name('canvas.tag.destroy');

// Topic routes...
Route::get('topics', 'TopicController@index')->name('canvas.topic.index');
Route::get('topics/create', 'TopicController@create')->name('canvas.topic.create');
Route::post('topics', 'TopicController@store')->name('canvas.topic.store');
Route::get('topics/{id}/edit', 'TopicController@edit')->name('canvas.topic.edit');
Route::put('topics/{id}', 'TopicController@update')->name('canvas.topic.update');
Route::delete('topics/{id}', 'TopicController@destroy')->name('canvas.topic.destroy');

// Settings routes...
Route::get('settings', 'SettingsController@index')->name('canvas.settings.index');
