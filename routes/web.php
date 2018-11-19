<?php

use Illuminate\Support\Facades\Route;

// Blog Routes...
Route::get('/', 'BlogController@index')->name('blog.index');
Route::get('/{post}', 'PostController@show')->name('blog.post.show');
Route::get('/tag/{tag}', 'TagController@index')->name('blog.tag.index');
