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

    /** @test */
    public function it_validates_an_empty_email()
    {
        $this->artisan('canvas:user admin')
             ->assertExitCode(0)
             ->expectsOutput('Please enter a valid email.');
    }

    /** @test */
    public function it_validates_an_invalid_email()
    {
        $this->artisan('canvas:user admin --email bad.email')
             ->assertExitCode(0)
             ->expectsOutput('Please enter a valid email.');
    }

    /** @test */
    public function it_can_create_a_new_contributor()
    {
        $role = 'contributor';
        $email = 'contributor@example.com';

        $this->artisan("canvas:user {$role} --email {$email}")
             ->assertExitCode(0)
             ->expectsOutput('New user created.');

        $this->assertDatabaseHas('canvas_users', [
            'email' => $email,
            'role' => User::CONTRIBUTOR,
        ]);
    }

    /** @test */
    public function it_can_create_a_new_editor()
    {
        $role = 'editor';
        $email = 'editor@example.com';

        $this->artisan("canvas:user {$role} --email {$email}")
             ->assertExitCode(0)
             ->expectsOutput('New user created.');

        $this->assertDatabaseHas('canvas_users', [
            'email' => $email,
            'role' => User::EDITOR,
        ]);
    }

    /** @test */
    public function it_can_create_a_new_admin()
    {
        $role = 'admin';
        $email = 'admin@example.com';

        $this->artisan("canvas:user {$role} --email {$email}")
             ->assertExitCode(0)
             ->expectsOutput('New user created.');

        $this->assertDatabaseHas('canvas_users', [
            'email' => $email,
            'role' => User::ADMIN,
        ]);
    }
}
