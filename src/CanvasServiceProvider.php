<?php

declare(strict_types=1);

namespace Canvas;

use Canvas\Console\AssignRoleCommand;
use Canvas\Console\DigestCommand;
use Canvas\Console\InstallCommand;
use Canvas\Console\MakeAdminCommand;
use Canvas\Console\MigrateCommand;
use Canvas\Console\PublishCommand;
use Canvas\Console\RemoveAccessCommand;
use Canvas\Console\RolesCommand;
use Canvas\Console\UiCommand;
use Canvas\Console\UsersCommand;
use Canvas\Contracts\WebhookEndpointRepository;
use Canvas\Events\PostDeleted;
use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;
use Canvas\Events\PostViewed;
use Canvas\Http\Requests\FormRequest;
use Canvas\Listeners\CaptureView;
use Canvas\Listeners\CaptureVisit;
use Canvas\Listeners\DispatchOutboundWebhooks;
use Canvas\Models\CanvasUser;
use Canvas\Models\Media;
use Canvas\Models\Post;
use Canvas\Policies\MediaPolicy;
use Canvas\Policies\PostPolicy;
use Canvas\Policies\UserPolicy;
use Canvas\Support\MediaService;
use Canvas\Support\MediaStorage;
use Canvas\Support\SettingsRepository;
use Canvas\Support\SettingsWebhookEndpointRepository;
use Canvas\Support\UploadLimits;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Contracts\Container\BindingResolutionException;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Validation\ValidatesWhenResolved;
use Illuminate\Events\Dispatcher;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\HttpFoundation\Response;

class CanvasServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/canvas.php', 'canvas');

        $this->app->singleton(MediaStorage::class, static fn (): MediaStorage => MediaStorage::make());
        $this->app->singleton(MediaService::class);
        $this->app->singleton(SettingsRepository::class);
        $this->app->singleton(WebhookEndpointRepository::class, SettingsWebhookEndpointRepository::class);
    }

    /**
     * @throws BindingResolutionException
     */
    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'canvas');
        $this->loadTranslationsFrom(__DIR__.'/../resources/lang', 'canvas');
        $this->configurePublishing();
        $this->configureRoutes();
        $this->configureCommands();
        $this->registerFormRequests();
        $this->registerMigrations();
        $this->registerGates();
        $this->registerEvents();
        $this->registerScheduler();
        $this->registerExceptionHandling();
    }

    private function registerExceptionHandling(): void
    {
        $this->callAfterResolving(ExceptionHandler::class, function (ExceptionHandler $handler): void {
            if (! method_exists($handler, 'renderable')) {
                return;
            }

            $handler->renderable(function (PostTooLargeException $exception, Request $request): ?Response {
                if (! UploadLimits::isCanvasApiRequest($request)) {
                    return null;
                }

                $message = UploadLimits::tooLargeMessage(
                    locale: UploadLimits::requestLocale($request),
                );

                return response()->json([
                    'message' => $message,
                    'errors' => [
                        'file' => [$message],
                    ],
                ], 413);
            });
        });
    }

    /**
     * @throws BindingResolutionException
     */
    private function registerEvents(): void
    {
        $mappings = [
            PostViewed::class => [
                CaptureView::class,
                CaptureVisit::class,
            ],
            PostPublished::class => [
                DispatchOutboundWebhooks::class,
            ],
            PostScheduled::class => [
                DispatchOutboundWebhooks::class,
            ],
            PostUpdated::class => [
                DispatchOutboundWebhooks::class,
            ],
            PostUnpublished::class => [
                DispatchOutboundWebhooks::class,
            ],
            PostDeleted::class => [
                DispatchOutboundWebhooks::class,
            ],
        ];

        /** @var Dispatcher $events */
        $events = $this->app->make(Dispatcher::class);

        foreach ($mappings as $event => $listeners) {
            foreach ($listeners as $listener) {
                $events->listen($event, $listener);
            }
        }
    }

    private function registerScheduler(): void
    {
        if (! config('canvas.mail.enabled')) {
            return;
        }

        $this->callAfterResolving(Schedule::class, function (Schedule $schedule): void {
            $schedule->command('canvas:digest')
                ->weekly()
                ->mondays()
                ->at('08:00')
                ->timezone(config('app.timezone'));
        });
    }

    private function configureRoutes(): void
    {
        Route::bind('user', function (mixed $value): mixed {
            $userModel = config('canvas.user_model');

            return $userModel::query()->findOrFail($value);
        });

        Route::middleware(config('canvas.middleware'))
            ->domain(config('canvas.domain'))
            ->prefix(config('canvas.path'))
            ->group(function (): void {
                $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
            });
    }

    private function configureCommands(): void
    {
        if (! $this->app->runningInConsole()) {
            return;
        }

        $this->commands([
            AssignRoleCommand::class,
            DigestCommand::class,
            InstallCommand::class,
            MigrateCommand::class,
            MakeAdminCommand::class,
            PublishCommand::class,
            RemoveAccessCommand::class,
            RolesCommand::class,
            UiCommand::class,
            UsersCommand::class,
        ]);
    }

    private function registerMigrations(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }

    private function registerGates(): void
    {
        Gate::policy(Media::class, MediaPolicy::class);
        Gate::policy(Post::class, PostPolicy::class);

        $userModel = config('canvas.user_model');
        Gate::policy($userModel, UserPolicy::class);

        Gate::define('manage-users', static function ($user): bool {
            return CanvasUser::isAdmin($user);
        });

        Gate::define('manage-taxonomy', static function ($user): bool {
            return CanvasUser::isAdmin($user);
        });

        Gate::define('manage-integrations', static function ($user): bool {
            return CanvasUser::isAdmin($user);
        });
    }

    private function registerFormRequests(): void
    {
        $this->app->afterResolving(ValidatesWhenResolved::class, function (ValidatesWhenResolved $resolved): void {
            $resolved->validateResolved();
        });

        $this->app->resolving(FormRequest::class, function (FormRequest $request, Application $app): FormRequest {
            $request = FormRequest::createFrom($app['request'], $request);

            return $request->setContainer($app)
                ->setRedirector($app->make(Redirector::class));
        });
    }

    private function configurePublishing(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../resources/dist' => public_path('vendor/canvas'),
            ], 'canvas-assets');

            $this->publishes([
                __DIR__.'/../config/canvas.php' => config_path('canvas.php'),
            ], 'canvas-config');

            $this->publishes([
                __DIR__.'/../resources/lang' => resource_path('lang/vendor/canvas'),
            ], 'canvas-lang');

            $this->publishes([
                __DIR__.'/../resources/views/ui' => resource_path('views/vendor/canvas/ui'),
            ], 'canvas-ui-views');
        }
    }
}
