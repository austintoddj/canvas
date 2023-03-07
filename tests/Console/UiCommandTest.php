<?php

namespace Canvas\Tests\Console;

use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class UiCommandTest.
 *
 * @covers \Canvas\Console\UiCommand
 */
class UiCommandTest extends TestCase
{
    use RefreshDatabase;

    public function testCanvasUiInstallationCommand(): void
    {
        $this->artisan('canvas:ui --force')
            ->assertExitCode(0)
            ->expectsOutput('Canvas UI scaffolding installed successfully.');

        $this->assertDirectoryExists(resource_path('views/canvas-ui'));

        $this->assertFileExists(app_path('Http/Controllers/CanvasUiController.php'));

        $this->assertStringContainsString('canvas-ui', file_get_contents(base_path('routes/web.php')));
    }
}
