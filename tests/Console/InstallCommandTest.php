<?php

namespace Canvas\Tests\Console;

use Canvas\Tests\TestCase;

class InstallCommandTest extends TestCase
{
    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        /*
         * We need to skip the installation test until there is a better way to reset
         * the entire App folder within testbench-core, since canvas:install will
         * register and publish a Service Provider into the Laravel app.
         *
         * @link https://github.com/cnvs/canvas/issues/456
         */
        $this->markTestSkipped();
    }

    /** @test */
    public function install_assets_and_configuration()
    {
        $this->artisan('canvas:install')
            ->expectsOutput('Publishing the assets...')
            ->expectsOutput('Publishing the configuration file...')
            ->expectsOutput('Running the database migrations...')
            ->expectsOutput('[✔] Canvas is installed and ready to use. Enjoy!')
            ->assertExitCode(0);
        $this->assertFileExists(config_path('canvas.php'));
        $this->assertDirectoryExists(public_path('vendor/canvas'));
    }
}
