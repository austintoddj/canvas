<?php

namespace Canvas;

use Canvas\Console\SetupCommand;
use Illuminate\Events\Dispatcher;
use Canvas\Console\InstallCommand;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Contracts\Container\BindingResolutionException;

class CanvasServiceProvider extends ServiceProvider
{
    use EventMap;

    /**
     * Bootstrap any package services.
     *
     * @return void
     * @throws BindingResolutionException
     */
    public function boot()
    {
        $this->registerEvents();
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
        $this->mergeConfigFrom(
            __DIR__.'/../config/canvas.php', 'canvas'
        );

        $this->commands([
            InstallCommand::class,
            SetupCommand::class,
        ]);
    }

    /**
     * Register the events and listeners.
     *
     * @return void
     * @throws BindingResolutionException
     */
    private function registerEvents()
    {
        $events = $this->app->make(Dispatcher::class);

        foreach ($this->events as $event => $listeners) {
            foreach ($listeners as $listener) {
                $events->listen($event, $listener);
            }
        }
    }

    /**
     * Register the routes.
     *
     * @return void
     */
    private function registerRoutes()
    {
        Route::namespace('Canvas\Http\Controllers')->group(function () {
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
            $this->loadMigrationsFrom(__DIR__.'/database/migrations');
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
            ], 'canvas-assets');
            $this->publishes([
                __DIR__.'/../config/canvas.php' => config_path('canvas.php'),
            ], 'canvas-config');
        }
    }
}
