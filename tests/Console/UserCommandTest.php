<?php

namespace Canvas\Tests\Console;

use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class AdminCommandTest.
 *
 * @covers \Canvas\Console\UserCommand
 */
class UserCommandTest extends TestCase
{
    use RefreshDatabase;

    public function testCanvasUserCommandWillValidateAnEmptyEmail(): void
    {
        $this->artisan('canvas:user admin')
             ->assertExitCode(0)
             ->expectsOutput('Please enter a valid email.');
    }

    public function testCanvasUserCommandWillValidateAnInvalidEmail(): void
    {
        $this->artisan('canvas:user admin --email bad.email')
             ->assertExitCode(0)
             ->expectsOutput('Please enter a valid email.');
    }

    public function testCanvasUserCommandWillValidateAnInvalidRole(): void
    {
        $this->artisan('canvas:user ad --email email@example.com')
             ->assertExitCode(0)
             ->expectsOutput('Please enter a valid role.');
    }

    public function testCanvasUserCommandCanCreateANewContributor(): void
    {
        $this->artisan('canvas:user contributor --email contributor@example.com')
             ->assertExitCode(0)
             ->expectsOutput('New user created.');

        $this->assertDatabaseHas('canvas_users', [
            'email' => 'contributor@example.com',
            'role' => User::CONTRIBUTOR,
        ]);
    }

    public function testCanvasUserCommandCanCreateANewEditor(): void
    {
        $this->artisan('canvas:user editor --email editor@example.com')
             ->assertExitCode(0)
             ->expectsOutput('New user created.');

        $this->assertDatabaseHas('canvas_users', [
            'email' => 'editor@example.com',
            'role' => User::EDITOR,
        ]);
    }

    public function testCanvasUserCommandCanCreateANewAdmin(): void
    {
        $this->artisan('canvas:user admin --email admin@example.com')
             ->assertExitCode(0)
             ->expectsOutput('New user created.');

        $this->assertDatabaseHas('canvas_users', [
            'email' => 'admin@example.com',
            'role' => User::ADMIN,
        ]);
    }
}
