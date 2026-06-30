<?php

namespace Canvas\Tests;

use Canvas\CanvasServiceProvider;
use Canvas\Tests\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Orchestra\Testbench\TestCase as OrchestraTestCase;

abstract class TestCase extends OrchestraTestCase
{
    use RefreshDatabase;

    /**
     * A test user with the role of Contributor.
     */
    protected User $contributor;

    /**
     * A test user with the role of Editor.
     */
    protected User $editor;

    /**
     * A test user with the role of Admin.
     */
    protected User $admin;

    protected function setUp(): void
    {
        $this->ensurePublishedConfigExists();

        parent::setUp();

        $this->publishPackageAssets();

        $this->contributor = User::factory()->contributor()->create();
        $this->editor = User::factory()->editor()->create();
        $this->admin = User::factory()->admin()->create();
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

        $config->set('database.default', 'sqlite');

        $config->set('database.connections.sqlite', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => true,
        ]);

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
        $this->loadLaravelMigrations();
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }

    protected function ensurePublishedConfigExists(): void
    {
        $source = dirname(__DIR__).'/config/canvas.php';
        $target = dirname(__DIR__).'/vendor/orchestra/testbench-core/laravel/config/canvas.php';

        if (! is_file($source)) {
            return;
        }

        $targetDirectory = dirname($target);

        if (! is_dir($targetDirectory)) {
            mkdir($targetDirectory, 0777, true);
        }

        if (! is_file($target)) {
            copy($source, $target);
        }
    }

    protected function publishPackageAssets(): void
    {
        $source = dirname(__DIR__).'/public/vendor/canvas';
        $target = public_path('vendor/canvas');

        if (! File::isDirectory($source)) {
            return;
        }

        File::ensureDirectoryExists(dirname($target));

        $lock = fopen(sys_get_temp_dir().'/canvas-test-assets.lock', 'c');

        if ($lock === false) {
            return;
        }

        flock($lock, LOCK_EX);

        try {
            if (! File::exists($target.'/manifest.json')) {
                if (File::isDirectory($target)) {
                    File::deleteDirectory($target);
                }

                File::copyDirectory($source, $target);
            }

            if (File::exists($target.'/canvas.hot')) {
                File::delete($target.'/canvas.hot');
            }
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}
