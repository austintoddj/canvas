<?php

use Illuminate\Support\Facades\Route;

Route::namespace('Canvas\Http\Controllers')->group(function () {
    Route::middleware(['web'])->prefix('blog')->group(function () {
        // Homepage Routes...
        Route::get('/', 'HomeController@index')->name('canvas.public.index');
    });

    Route::middleware(['web', 'auth'])->prefix('canvas')->group(function () {
        // Dashboard Routes...
        Route::get('/', 'DashboardController@index')->name('canvas.admin.index');
    });
});
