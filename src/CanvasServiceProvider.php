<?php

namespace Canvas;

use Canvas\Console\SetupCommand;
use Canvas\Console\DigestCommand;
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
        $this->handleEvents();
        $this->handleRoutes();
        $this->handleMigrations();
        $this->handlePublishing();
        $this->handleResources();
        $this->handleTranslations();
    }

    /**
     * Register bindings in the container.
     *
     * @return void
     */
    public function register()
    {
        $this->handleConfig();
        $this->handleCommands();
    }

    /**
     * Register the events and listeners.
     *
     * @return void
     * @throws BindingResolutionException
     */
    private function handleEvents()
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
    private function handleRoutes()
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
     * Register the resources.
     *
     * @return void
     */
    private function handleResources()
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'canvas');
    }

    /**
     * Register the translations.
     *
     * @return void
     */
    private function handleTranslations()
    {
        $this->loadTranslationsFrom(__DIR__.'/../resources/lang', 'canvas');
    }

    /**
     * Register the package's migrations.
     *
     * @return void
     */
    private function handleMigrations()
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
    private function handlePublishing()
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../public' => public_path('vendor/canvas'),
            ], 'canvas-assets');

            $this->publishes([
                __DIR__.'/../config/canvas.php' => config_path('canvas.php'),
            ], 'canvas-config');

            $this->publishes([
                __DIR__.'/../stubs/providers/CanvasServiceProvider.stub' => app_path(
                    'Providers/CanvasServiceProvider.php'
                ),
            ], 'canvas-provider');
        }
    }

    /**
     * @return void
     */
    private function handleConfig(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../config/canvas.php',
            'canvas'
        );
    }

    /**
     * @return void
     */
    private function handleCommands(): void
    {
        $this->commands([
            DigestCommand::class,
            InstallCommand::class,
            PublishCommand::class,
            SetupCommand::class,
        ]);
    }
}
