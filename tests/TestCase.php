<?php

namespace Canvas\Tests;

use ReflectionClass;
use ReflectionException;
use Canvas\CanvasServiceProvider;
use Illuminate\Foundation\Auth\User;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Orchestra\Testbench\TestCase as OrchestraTestCase;

abstract class TestCase extends OrchestraTestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpDatabase($this->app);
    }

    /**
     * @param Application $app
     * @return array
     */
    protected function getPackageProviders($app): array
    {
        return [
            CanvasServiceProvider::class,
        ];
    }

    /**
     * @param Application $app
     * @return void
     */
    protected function resolveApplicationCore($app)
    {
        parent::resolveApplicationCore($app);

        $app->detectEnvironment(function () {
            return 'testing';
        });
    }

    /**
     * @param Application $app
     * @return void
     */
    protected function getEnvironmentSetUp($app): void
    {
        $config = $app->get('config');

        $config->set('database.default', 'sqlite');

        $config->set('database.connections.sqlite', [
            'driver'   => 'sqlite',
            'database' => ':memory:',
            'prefix'   => '',
        ]);

        $config->set('view.paths', [dirname(__DIR__).'/resources/views']);

        $config->set('auth.providers.users.model', User::class);
    }

    /**
     * @param Application $app
     * @return void
     */
    protected function setUpDatabase($app): void
    {
        $this->loadLaravelMigrations();

        $this->loadMigrationsFrom(dirname(__DIR__).'/database/migrations');

        $this->artisan('migrate');
    }

    /**
     * Call the protected or private methods of a class.
     *
     * @param $object
     * @param string $method
     * @param array $parameters
     * @return mixed
     * @throws ReflectionException
     */
    protected function invokeMethod(&$object, string $method, array $parameters = [])
    {
        $reflection = new ReflectionClass(get_class($object));
        $method = $reflection->getMethod($method);
        $method->setAccessible(true);

        return $method->invokeArgs($object, $parameters);
    }
}
