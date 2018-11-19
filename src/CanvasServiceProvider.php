<?php

namespace Canvas;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class CanvasServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any package services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerRoutes();
        $this->registerMigrations();
        $this->registerPublishing();
        $this->registerResources();
    }

    /**
     * Register any package services.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(__DIR__.'/../config/canvas.php', 'canvas');
        $this->commands([
            Console\InstallCommand::class,
        ]);
    }

    /**
     * Register the routes.
     *
     * @return void
     */
    private function registerRoutes()
    {
        Route::namespace('Canvas\Http\Controllers')->group(function () {
            Route::prefix(config('canvas.path'))->middleware(['web'])->group(function () {
                $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
            });

            Route::prefix('canvas')->middleware(config('canvas.middleware'))->group(function () {
                $this->loadRoutesFrom(__DIR__.'/../routes/canvas.php');
            });
        });
    }

    /**
     * Register the resources.
     *
     * @return void
     */
    private function registerResources()
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'canvas');
    }

    /**
     * Register the package's migrations.
     *
     * @return void
     */
    private function registerMigrations()
    {
        if ($this->app->runningInConsole()) {
            $this->loadMigrationsFrom(__DIR__.'/Migrations');
        }
    }

    /**
     * Register the package's publishable resources.
     *
     * @return void
     */
    private function registerPublishing()
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../public' => public_path('vendor/canvas'),
            ], 'assets');
            $this->publishes([
                __DIR__.'/../config/canvas.php' => config_path('canvas.php'),
            ], 'config');
            $this->publishes([
                __DIR__.'/../resources/views' => resource_path('views/vendor/canvas'),
            ], 'views');
        }
    }
}
