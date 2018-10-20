<?php

namespace Tests;

use Faker\Generator;
use Laravel\BrowserKitTesting\TestCase as BaseTestCase;
use Illuminate\Database\Eloquent\Factory as EloquentFactory;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp()
    {
        parent::setUp();

        $this->app->singleton(EloquentFactory::class, function () {
            return EloquentFactory::construct(app(Generator::class), base_path().'/vendor/cnvs/easel/database/factories');
        });
    }
}
