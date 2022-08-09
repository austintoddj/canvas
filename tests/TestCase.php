<?php

namespace Canvas\Tests;

use Canvas\CanvasServiceProvider;
use Canvas\Models\User;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Orchestra\Testbench\TestCase as OrchestraTestCase;

abstract class TestCase extends OrchestraTestCase
{
    use RefreshDatabase;

    /**
     * A test user with Contributor access.
     *
     * @var \Canvas\Models\User
     */
    protected $contributor;

    /**
     * A test user with Editor access.
     *
     * @var \Canvas\Models\User
     */
    protected $editor;

    /**
     * A test user with Admin access.
     *
     * @var \Canvas\Models\User
     */
    protected $admin;

    /**
     * @return void
     *
     * @throws Exception
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpDatabase($this->app);

        $this->createTestUsers();
    }

    /**
     * @param  \Illuminate\Foundation\Application  $app
     * @return array
     */
    protected function getPackageProviders($app): array
    {
        return [
            CanvasServiceProvider::class,
        ];
    }

    /**
     * @param  \Illuminate\Foundation\Application  $app
     * @return void
     */
    protected function resolveApplicationCore($app): void
    {
        parent::resolveApplicationCore($app);

        $app->detectEnvironment(function () {
            return 'testing';
        });
    }

    /**
     * @param  \Illuminate\Foundation\Application  $app
     * @return void
     */
    protected function getEnvironmentSetUp($app): void
    {
        $config = $app->get('config');

        $config->set('view.paths', [dirname(__DIR__).'/resources/views']);

        $config->set('database.default', 'sqlite');

        $config->set('database.connections.sqlite', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
        ]);

        $config->set('auth.providers.canvas_users', [
            'driver' => 'eloquent',
            'model' => User::class,
        ]);

        $config->set('auth.guards.canvas', [
            'driver' => 'session',
            'provider' => 'canvas_users',
        ]);
    }

    /**
     * @param  \Illuminate\Foundation\Application  $app
     * @return void
     *
     * @throws Exception
     */
    protected function setUpDatabase($app)
    {
        $this->loadLaravelMigrations();
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadFactoriesUsing($app, __DIR__.'/../database/factories');

        $this->artisan('migrate');
    }

    /**
     * Create a test user for each role.
     *
     * @return void
     */
    protected function createTestUsers()
    {
        $this->contributor = factory(User::class)->create([
            'role' => User::$contributor_id,
        ]);

        $this->editor = factory(User::class)->create([
            'role' => User::$editor_id,
        ]);

        $this->admin = factory(User::class)->create([
            'role' => User::$admin_id,
        ]);
    }
}
