<?php

namespace Canvas;

use Canvas\Console\DigestCommand;
use Canvas\Console\InstallCommand;
use Canvas\Console\PublishCommand;
use Canvas\Console\SetupCommand;
use Illuminate\Contracts\Container\BindingResolutionException;
use Illuminate\Events\Dispatcher;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

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
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'canvas');
        $this->loadTranslationsFrom(__DIR__.'/../resources/lang', 'canvas');
    }

    /**
     * Register bindings in the container.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(
            __DIR__.'/../config/canvas.php',
            'canvas'
        );

        $this->commands([
            DigestCommand::class,
            InstallCommand::class,
            PublishCommand::class,
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
     * Register the package routes.
     *
     * @return void
     */
    private function registerRoutes()
    {
        Route::group($this->routeConfiguration(), function () {
            $this->loadRoutesFrom(__DIR__.'/Http/routes.php');
        });
    }

    /**
     * Get the Canvas route group configuration array.
     *
     * @return array
     */
    private function routeConfiguration()
    {
        return [
            'namespace'  => 'Canvas\Http\Controllers',
            'prefix'     => config('canvas.path'),
            'middleware' => config('canvas.middleware'),
        ];
    }

    /**
     * Register the package's migrations.
     *
     * @return void
     */
    private function registerMigrations()
    {
        if ($this->app->runningInConsole()) {
            $this->loadMigrationsFrom(__DIR__.'/Storage/migrations');
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

            $this->publishes([
                __DIR__.'/../resources/stubs/providers/CanvasServiceProvider.stub' => app_path(
                    'Providers/CanvasServiceProvider.php'
                ),
            ], 'canvas-provider');
        }
    }
}
