<?php

use Canvas\CanvasServiceProvider;
use Canvas\Contracts\HostResolver;
use Canvas\Support\DnsHostResolver;
use Canvas\Support\UploadLimits;
use Canvas\Tests\Models\User;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Support\Facades\Route;

class HostRouteUser extends User
{
    public function resolveRouteBinding($value, $field = null): ?Model
    {
        return $this->newQuery()->where('email', $value)->firstOrFail();
    }
}

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

it('registers announce-scheduled every minute regardless of mail', function (): void {
    config([
        'canvas.mail.enabled' => false,
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

        return str_contains($command, 'canvas:announce-scheduled')
            || str_contains($description, 'canvas:announce-scheduled');
    });

    expect($event)->not->toBeNull();
    expect((string) $event->expression)->toBe('* * * * *');
    expect((string) $event->timezone)->toBe('UTC');

    $digest = collect($schedule->events())->first(function ($event): bool {
        $command = (string) ($event->command ?? '');
        $description = (string) ($event->description ?? '');

        return str_contains($command, 'canvas:digest')
            || str_contains($description, 'canvas:digest');
    });

    expect($digest)->toBeNull();
});

it('registers webhook delivery prune weekly regardless of mail', function (): void {
    config([
        'canvas.mail.enabled' => false,
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

        return str_contains($command, 'canvas:prune-webhook-deliveries')
            || str_contains($description, 'canvas:prune-webhook-deliveries');
    });

    expect($event)->not->toBeNull()
        ->and((string) $event->timezone)->toBe('UTC');
});

it('registers prune-post-revisions on the weekly schedule', function (): void {
    config([
        'canvas.mail.enabled' => false,
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

        return str_contains($command, 'canvas:prune-post-revisions')
            || str_contains($description, 'canvas:prune-post-revisions');
    });

    expect($event)->not->toBeNull()
        ->and((string) $event->timezone)->toBe('UTC');
});

it('does not register the digest schedule when mail is disabled', function (): void {
    config(['canvas.mail.enabled' => false]);

    $provider = new CanvasServiceProvider($this->app);

    $method = new ReflectionMethod(CanvasServiceProvider::class, 'registerScheduler');
    $method->setAccessible(true);
    $method->invoke($provider);

    /** @var Schedule $schedule */
    $schedule = $this->app->make(Schedule::class);

    $digest = collect($schedule->events())->first(function ($event): bool {
        $command = (string) ($event->command ?? '');
        $description = (string) ($event->description ?? '');

        return str_contains($command, 'canvas:digest')
            || str_contains($description, 'canvas:digest');
    });

    expect($digest)->toBeNull();
});

it('binds the dns host resolver', function (): void {
    (new CanvasServiceProvider($this->app))->register();

    expect($this->app->make(HostResolver::class))->toBeInstanceOf(DnsHostResolver::class);
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

it('renders a clear json 413 for post too large on canvas api routes', function (): void {
    $request = Request::create('/canvas/api/media/'.fake()->uuid(), 'POST');
    $request->headers->set('Accept', 'application/json');

    $response = $this->app->make(ExceptionHandler::class)
        ->render($request, new PostTooLargeException('The POST data is too large.'));

    expect($response->getStatusCode())->toBe(413)
        ->and($response->headers->get('content-type'))->toContain('application/json');

    $payload = $response->getData(true);
    $message = UploadLimits::tooLargeMessage();

    expect($payload['message'])->toBe($message)
        ->and($payload['errors']['file'] ?? null)->toBe([$message]);
});

it('does not claim post too large responses for non-canvas routes', function (): void {
    $request = Request::create('/api/unrelated', 'POST');
    $request->headers->set('Accept', 'application/json');

    $response = $this->app->make(ExceptionHandler::class)
        ->render($request, new PostTooLargeException('The POST data is too large.'));

    $payload = method_exists($response, 'getData') ? $response->getData(true) : null;

    if (is_array($payload)) {
        expect($payload['message'] ?? null)->not->toBe(UploadLimits::tooLargeMessage());
    }

    expect($response->getStatusCode())->toBe(413);
});

// Regression: GH-1542 — the global "user" route binding overrode the host's own binding behavior
it('leaves the user route binding of host routes untouched', function (): void {
    Route::get('host/users/{user}', fn (HostRouteUser $user): string => $user->email)
        ->middleware(SubstituteBindings::class);

    User::factory()->create(['email' => 'host@example.com']);

    $this->get('host/users/host@example.com')
        ->assertSuccessful()
        ->assertSee('host@example.com');
});

it('passes the raw user parameter through on host routes without a bound model', function (): void {
    Route::get('host/raw/{user}', fn (string $user): string => $user)
        ->middleware(SubstituteBindings::class);

    $this->get('host/raw/abc-123')
        ->assertSuccessful()
        ->assertSee('abc-123');
});

// Invariant: canvas routes keep resolving {user} through the configured canvas.user_model
it('still resolves the user parameter on canvas routes', function (): void {
    $this->actingAsAdmin()
        ->getJson("canvas/api/users/{$this->editor->id}")
        ->assertSuccessful()
        ->assertJsonPath('id', $this->editor->id);

    $this->actingAsAdmin()
        ->getJson('canvas/api/users/999999')
        ->assertNotFound();
});
