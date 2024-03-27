<?php

use Canvas\Http\Controllers\FeedController;
use Illuminate\Support\Facades\Route;

Route::get('/feed', [FeedController::class, '__invoke'])->name('feed');
