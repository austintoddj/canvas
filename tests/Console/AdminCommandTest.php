<?php

namespace Canvas\Tests\Console;

use Canvas\Models\UserMeta;
use Canvas\Tests\TestCase;

/**
 * Class AdminCommandTest.
 *
 * @covers \Canvas\Console\AdminCommand
 */
class AdminCommandTest extends TestCase
{
    /** @test */
    public function it_validates_an_empty_email()
    {
        $this->artisan('canvas:admin')
             ->expectsQuestion('Enter the email of the user to grant admin access to', '')
             ->assertExitCode(0)
             ->expectsOutput('Please enter a valid email.');
    }

    /** @test */
    public function it_returns_an_error_if_no_user_is_found()
    {
        $this->artisan('canvas:admin')
             ->expectsQuestion('Enter the email of the user to grant admin access to', 'test@example.com')
             ->assertExitCode(0)
             ->expectsOutput('Unable to find a user with that email.');
    }

    /** @test */
    public function it_returns_successfully_if_user_is_already_an_admin()
    {
        $meta = factory(UserMeta::class)->create([
            'admin' => true,
        ]);

        $this->artisan('canvas:admin')
             ->expectsQuestion('Enter the email of the user to grant admin access to', $meta->user->email)
             ->assertExitCode(0)
             ->expectsOutput('User is already an admin.');
    }

    /** @test */
    public function it_grants_admin_access_to_a_user()
    {
        $meta = factory(UserMeta::class)->create([
            'admin' => false,
        ]);

        $this->artisan('canvas:admin')
             ->expectsQuestion('Enter the email of the user to grant admin access to', $meta->user->email)
             ->assertExitCode(0)
             ->expectsOutput('Access granted.');
    }
}
