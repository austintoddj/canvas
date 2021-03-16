<?php

use Canvas\Http\Controllers\Auth\AuthenticatedSessionController;
use Canvas\Http\Controllers\Auth\NewPasswordController;
use Canvas\Http\Controllers\Auth\PasswordResetLinkController;
use Illuminate\Support\Facades\Route;

Route::namespace('Auth')->group(function () {
    // Login routes...
    Route::prefix('login')->group(function () {
        Route::get('/', [AuthenticatedSessionController::class, 'create'])->name('canvas.login');
        Route::post('/', [AuthenticatedSessionController::class, 'store']);
    });

    // Forgot password routes...
    Route::prefix('forgot-password')->group(function () {
        Route::get('/', [PasswordResetLinkController::class, 'create'])->name('canvas.password.request');
        Route::post('/', [PasswordResetLinkController::class, 'store'])->name('canvas.password.email');
    });

    // Reset password routes...
    Route::prefix('reset-password')->group(function () {
        Route::get('{token}', [NewPasswordController::class, 'create'])->name('canvas.password.reset');
        Route::post('/', [NewPasswordController::class, 'store'])->name('canvas.password.update');
    });

    // Logout route...
    Route::get('logout', [AuthenticatedSessionController::class, 'destroy'])->name('canvas.logout');
});
