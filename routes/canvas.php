<?php

use Illuminate\Support\Facades\Route;

// Dashboard Routes...
Route::get('/', 'CanvasController@index')->name('canvas.index');

// Post Routes...
Route::get('posts', 'PostController@index')->name('canvas.post.index');
Route::get('posts/create', 'PostController@create')->name('canvas.post.create');
Route::post('posts', 'PostController@store')->name('canvas.post.store');
Route::get('posts/{id}/edit', 'PostController@edit')->name(('canvas.post.edit'));
Route::put('posts/{id}', 'PostController@update')->name('canvas.post.update');
Route::delete('posts/{id}', 'PostController@destroy')->name('canvas.post.destroy');

// Tag Routes...
Route::get('tags', 'TagController@index')->name('canvas.tag.index');
Route::get('tags/create', 'TagController@create')->name('canvas.tag.create');
Route::post('tags', 'TagController@store')->name('canvas.tag.store');
Route::get('tags/{id}/edit', 'TagController@edit')->name(('canvas.tag.edit'));
Route::put('tags/{id}', 'TagController@update')->name('canvas.tag.update');
Route::delete('tags/{id}', 'TagController@destroy')->name('canvas.tag.destroy');
