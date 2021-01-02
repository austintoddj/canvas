<?php

namespace Canvas\Tests\Console;

use App\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class InstallCommandTest.
 *
 * @covers \Canvas\Console\InstallCommand
 */
class InstallCommandTest extends TestCase
{
    use RefreshDatabase;

    public function testCanvasInstallationCommand(): void
    {
        $this->artisan('canvas:install')
             ->assertExitCode(0)
             ->expectsOutput('Installation complete.');

        $this->assertDatabaseHas('canvas_users', [
            'email' => 'email@example.com',
            'role' => User::ADMIN,
        ]);
    }
}
