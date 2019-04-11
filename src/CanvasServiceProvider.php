<?php

namespace Canvas;

use Canvas\Console\SetupCommand;
use Canvas\Console\ExportCommand;
use Illuminate\Events\Dispatcher;
use Canvas\Console\InstallCommand;
use Canvas\Console\PublishCommand;
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
            ExportCommand::class,
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
            $this->loadRoutesFrom(__DIR__.'/../routes/canvas.php');
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
            'prefix'     => 'canvas',
            'middleware' => config('canvas.middleware'),
        ];
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
            $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
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
                __DIR__.'/../stubs/providers/CanvasServiceProvider.stub' => app_path('Providers/CanvasServiceProvider.php'),
            ], 'canvas-provider');
        }
    }
}
