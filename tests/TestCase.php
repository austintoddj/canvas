<?php

namespace Canvas\Tests;

use Canvas\CanvasServiceProvider;
use Canvas\Tests\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        parent::setUp();

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
}
