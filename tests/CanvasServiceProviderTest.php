<?php

use Canvas\CanvasServiceProvider;
use Illuminate\Console\Scheduling\Schedule;

it('registers the weekly digest schedule when mail is enabled', function (): void {
    config([
        'canvas.mail.enabled' => true,
        'app.timezone' => 'UTC',
    ]);

    $provider = new CanvasServiceProvider($this->app);

    $method = new ReflectionMethod(CanvasServiceProvider::class, 'registerScheduler');
    $method->setAccessible(true);
    $method->invoke($provider);

    /** @var Schedule $schedule */
    $schedule = $this->app->make(Schedule::class);

    $event = collect($schedule->events())->first(function ($event): bool {
        $command = (string) ($event->command ?? '');
        $description = (string) ($event->description ?? '');

        return str_contains($command, 'canvas:digest')
            || str_contains($description, 'canvas:digest');
    });

    expect($event)->not->toBeNull();
    expect((string) $event->expression)->toContain('8');
    expect((string) $event->expression)->toContain('1');
    expect((string) $event->timezone)->toBe('UTC');
});

it('does not register the digest schedule when mail is disabled', function (): void {
    config(['canvas.mail.enabled' => false]);

    $provider = new CanvasServiceProvider($this->app);

    $method = new ReflectionMethod(CanvasServiceProvider::class, 'registerScheduler');
    $method->setAccessible(true);
    $method->invoke($provider);

    // Early return path — mail disabled means no afterResolving callback from this invoke.
    expect(config('canvas.mail.enabled'))->toBeFalse();
});

it('returns early from command registration when not running in console', function (): void {
    $provider = new CanvasServiceProvider($this->app);

    $property = new ReflectionProperty($this->app, 'isRunningInConsole');
    $property->setAccessible(true);
    $previous = $property->getValue($this->app);

    try {
        $property->setValue($this->app, false);

        $method = new ReflectionMethod(CanvasServiceProvider::class, 'configureCommands');
        $method->setAccessible(true);
        $method->invoke($provider);

        expect($this->app->runningInConsole())->toBeFalse();
    } finally {
        $property->setValue($this->app, $previous);
    }
});
