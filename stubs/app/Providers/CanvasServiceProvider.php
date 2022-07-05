<?php

namespace App\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\ServiceProvider;

class CanvasServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        $this->app->booted(function () {
            $schedule = resolve(Schedule::class);
            $schedule->command('canvas:digest')
                     ->weekly()
                     ->mondays()
                     ->timezone(config('app.timezone'))
                     ->at('08:00')
                     ->when(function () {
                         return config('canvas.mail.enabled');
                     });
        });
    }
}
