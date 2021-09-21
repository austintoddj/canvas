<?php

namespace Canvas;

use Canvas\Console\DigestCommand;
use Canvas\Console\InstallCommand;
use Canvas\Console\MigrateCommand;
use Canvas\Console\PublishCommand;
use Canvas\Console\UiCommand;
use Canvas\Console\UserCommand;
use Canvas\Events\PostViewed;
use Canvas\Listeners\CaptureView;
use Canvas\Listeners\CaptureVisit;
use Canvas\Models\User;
use Illuminate\Contracts\Container\BindingResolutionException;
use Illuminate\Events\Dispatcher;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class CanvasServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/canvas.php', 'canvas');
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     *
     * @throws BindingResolutionException
     */
    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'canvas');
        $this->loadTranslationsFrom(__DIR__.'/../resources/lang', 'canvas');
        $this->configurePublishing();
        $this->configureRoutes();
        $this->configureCommands();
        $this->registerMigrations();
        $this->registerAuthDriver();
        $this->registerEvents();
    }

    /**
     * Register the events and listeners.
     *
     * @return void
     *
     * @throws BindingResolutionException
     */
    private function registerEvents(): void
    {
        $mappings = [
            PostViewed::class => [
                CaptureView::class,
                CaptureVisit::class,
            ],
        ];

        $events = $this->app->make(Dispatcher::class);

        foreach ($mappings as $event => $listeners) {
            foreach ($listeners as $listener) {
                $events->listen($event, $listener);
            }
        }
    }

    /**
     * Configure the routes offered by the application.
     *
     * @return void
     */
    private function configureRoutes(): void
    {
        Route::namespace('Canvas\Http\Controllers')
             ->middleware(config('canvas.middleware'))
             ->domain(config('canvas.domain'))
             ->prefix(config('canvas.path'))
             ->group(function () {
                 $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
             });
    }

    /**
     * Configure the commands offered by the application.
     *
     * @return void
     */
    private function configureCommands(): void
    {
        $this->commands([
            DigestCommand::class,
            InstallCommand::class,
            MigrateCommand::class,
            PublishCommand::class,
            UiCommand::class,
            UserCommand::class,
        ]);
    }

    /**
     * Register the package's migrations.
     *
     * @return void
     */
    private function registerMigrations(): void
    {
        if ($this->app->runningInConsole()) {
            $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        }
    }

    /**
     * Register the package's authentication driver.
     *
     * @return void
     */
    private function registerAuthDriver(): void
    {
        $this->app->config->set('auth.providers.canvas_users', [
            'driver' => 'eloquent',
            'model' => User::class,
        ]);

        $this->app->config->set('auth.guards.canvas', [
            'driver' => 'session',
            'provider' => 'canvas_users',
        ]);
    }

    /**
     * Configure publishing for the package.
     *
     * @return void
     */
    private function configurePublishing(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../public' => public_path('vendor/canvas'),
            ], 'canvas-assets');

            $this->publishes([
                __DIR__.'/../config/canvas.php' => config_path('canvas.php'),
            ], 'canvas-config');

            $this->publishes([
                __DIR__.'/../resources/lang' => resource_path('lang/vendor/canvas'),
            ], 'canvas-lang');

            $this->publishes([
                __DIR__.'/../resources/stubs/providers/CanvasServiceProvider.stub' => app_path(
                    'Providers/CanvasServiceProvider.php'
                ),
            ], 'canvas-provider');
        }
    }
}
