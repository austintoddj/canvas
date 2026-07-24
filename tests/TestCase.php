<?php

namespace Canvas\Tests;

use Canvas\CanvasServiceProvider;
use Canvas\Tests\Models\User;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Orchestra\Testbench\TestCase as OrchestraTestCase;

/**
 * @property-read User $contributor
 * @property-read User $editor
 * @property-read User $admin
 */
abstract class TestCase extends OrchestraTestCase
{
    use RefreshDatabase;

    /** @var array<string, User> */
    private array $lazyCanvasUsers = [];

    public function __get(string $name): mixed
    {
        if (! in_array($name, ['contributor', 'editor', 'admin'], true)) {
            throw new \RuntimeException("Undefined property [{$name}]");
        }

        return $this->lazyCanvasUsers[$name] ??= User::factory()->{$name}()->create();
    }

    protected function seedDefaultCanvasUsers(): void
    {
        $this->contributor;
        $this->editor;
        $this->admin;
    }

    protected function actingAsContributor(): static
    {
        return $this->actingAs($this->contributor, 'canvas');
    }

    protected function actingAsEditor(): static
    {
        return $this->actingAs($this->editor, 'canvas');
    }

    protected function actingAsAdmin(): static
    {
        return $this->actingAs($this->admin, 'canvas');
    }

    /**
     * Serialize mutations to the shared Testbench app tree (config + public assets).
     * Parallel Pest workers share vendor/orchestra/testbench-core/laravel.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public static function withSharedTestbenchLock(callable $callback): mixed
    {
        $lock = fopen(sys_get_temp_dir().'/canvas-testbench-shared.lock', 'c');

        if ($lock === false) {
            return $callback();
        }

        flock($lock, LOCK_EX);

        try {
            return $callback();
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    /**
     * Hold-for-duration lock for canvas:ui scaffold paths (controller, views, routes).
     * UiCommandTest and CanvasUiControllerTest must share this so parallel workers
     * never install vs delete the same Testbench app files concurrently.
     *
     * @var resource|null
     */
    private static $canvasUiScaffoldLock = null;

    public static function acquireCanvasUiScaffoldLock(): void
    {
        if (self::$canvasUiScaffoldLock !== null) {
            return;
        }

        $lock = fopen(sys_get_temp_dir().'/canvas-test-ui.lock', 'c');

        if ($lock === false) {
            return;
        }

        flock($lock, LOCK_EX);
        self::$canvasUiScaffoldLock = $lock;
    }

    public static function releaseCanvasUiScaffoldLock(): void
    {
        if (self::$canvasUiScaffoldLock === null) {
            return;
        }

        flock(self::$canvasUiScaffoldLock, LOCK_UN);
        fclose(self::$canvasUiScaffoldLock);
        self::$canvasUiScaffoldLock = null;
    }

    protected function setUp(): void
    {
        $this->ensurePublishedConfigExists();

        parent::setUp();

        $this->publishPackageAssets();
    }

    protected function getPackageProviders($app): array
    {
        return [
            CanvasServiceProvider::class,
        ];
    }

    protected function getEnvironmentSetUp($app): void
    {
        $config = $app->get('config');

        $config->set('view.paths', [dirname(__DIR__).'/resources/views']);

        $this->configureTestDatabase($config);

        $config->set('auth.providers.canvas_users', [
            'driver' => 'eloquent',
            'model' => User::class,
        ]);

        $config->set('auth.guards.canvas', [
            'driver' => 'session',
            'provider' => 'canvas_users',
        ]);

        $config->set('canvas.user_model', User::class);
        $config->set('canvas.guard', 'canvas');

    }

    protected function defineDatabaseMigrations(): void
    {
        // Package test `users` table mirrors stock Laravel bigint keys (+ soft deletes for HasCanvasAccess tests).
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }

    /**
     * Default: SQLite :memory:. Override with DB_CONNECTION=mysql|pgsql for CI driver jobs.
     *
     * @param  Repository  $config
     */
    protected function configureTestDatabase(mixed $config): void
    {
        $driver = env('DB_CONNECTION', 'sqlite');

        if ($driver === 'mysql') {
            $config->set('database.default', 'mysql');
            $config->set('database.connections.mysql', [
                'driver' => 'mysql',
                'host' => env('DB_HOST', '127.0.0.1'),
                'port' => env('DB_PORT', '3306'),
                'database' => env('DB_DATABASE', 'canvas_test'),
                'username' => env('DB_USERNAME', 'root'),
                'password' => env('DB_PASSWORD', ''),
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => true,
                'engine' => null,
            ]);

            return;
        }

        if ($driver === 'pgsql') {
            $config->set('database.default', 'pgsql');
            $config->set('database.connections.pgsql', [
                'driver' => 'pgsql',
                'host' => env('DB_HOST', '127.0.0.1'),
                'port' => env('DB_PORT', '5432'),
                'database' => env('DB_DATABASE', 'canvas_test'),
                'username' => env('DB_USERNAME', 'postgres'),
                'password' => env('DB_PASSWORD', 'postgres'),
                'charset' => 'utf8',
                'prefix' => '',
                'prefix_indexes' => true,
                'search_path' => 'public',
                'sslmode' => 'prefer',
            ]);

            return;
        }

        $config->set('database.default', 'sqlite');
        $config->set('database.connections.sqlite', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]);
    }

    protected function ensurePublishedConfigExists(): void
    {
        $source = dirname(__DIR__).'/config/canvas.php';
        $target = dirname(__DIR__).'/vendor/orchestra/testbench-core/laravel/config/canvas.php';

        if (! is_file($source)) {
            return;
        }

        self::withSharedTestbenchLock(function () use ($source, $target): void {
            $targetDirectory = dirname($target);

            if (! is_dir($targetDirectory)) {
                mkdir($targetDirectory, 0777, true);
            }

            if ($this->publishedConfigLooksValid($target)) {
                return;
            }

            $staging = $target.'.staging.'.getmypid();
            copy($source, $staging);
            rename($staging, $target);
        });
    }

    protected function publishPackageAssets(): void
    {
        $source = dirname(__DIR__).'/resources/dist';
        $target = public_path('vendor/canvas');

        if (! File::isDirectory($source)) {
            return;
        }

        self::withSharedTestbenchLock(function () use ($source, $target): void {
            File::ensureDirectoryExists(dirname($target));

            if (! File::exists($target.'/manifest.json')) {
                $staging = dirname($target).'/canvas-assets-staging-'.getmypid();

                if (File::isDirectory($staging)) {
                    File::deleteDirectory($staging);
                }

                File::copyDirectory($source, $staging);

                if (File::isDirectory($target)) {
                    File::deleteDirectory($target);
                }

                rename($staging, $target);
            }

            if (File::exists($target.'/canvas.hot')) {
                File::delete($target.'/canvas.hot');
            }
        });
    }

    private function publishedConfigLooksValid(string $path): bool
    {
        if (! is_file($path) || filesize($path) === 0) {
            return false;
        }

        $contents = file_get_contents($path);

        if ($contents === false || ! str_contains($contents, 'CANVAS_PATH')) {
            return false;
        }

        return true;
    }
}
