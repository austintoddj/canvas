<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use Tests\CreatesUser;
use Illuminate\Http\Response;
use Tests\InteractsWithDatabase;
use Illuminate\Support\Facades\Auth;

class AuthenticationTest extends TestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_validates_the_login_form_when_user_enters_nothing()
    {
        // Actions
        $this->visit(route('canvas.admin'))
        ->press('submit');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin'))
            ->see(e('The email field is required.'))
            ->see(e('The password field is required.'));
    }

    /** @test */
    public function it_validates_the_login_form_when_user_enters_wrong_email()
    {
        // Actions
        $this->visit(route('canvas.admin'))
            ->type('foo@bar.com', 'email')
            ->type('password', 'password')
            ->press('submit');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin'))
            ->see(e('These credentials do not match our records.'));
    }

    /** @test */
    public function it_validates_the_forgot_password_form_when_user_enters_nothing()
    {
        // Actions
        $this->visit(route('canvas.auth.password.forgot'))
            ->press('submit');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.auth.password.forgot'))
            ->see(e('The email field is required.'));
    }

    /** @test */
    public function it_validates_the_forgot_password_form_when_user_enters_wrong_email()
    {
        // Actions
        $this->visit(route('canvas.auth.password.forgot'))
            ->type('foo@bar.com', 'email')
            ->press('submit');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.auth.password.forgot'))
            ->see('We can\'t find a user with that e-mail address.');
    }

    /** @test */
    public function it_can_login_to_the_application()
    {
        // Actions
        $this->createUser()->visit(route('canvas.admin'))
            ->type($this->user->email, 'email')
            ->type('password', 'password')
            ->press('submit');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin'))
            ->see(e('Welcome to Canvas!'))
            ->see($this->user->display_name);
        $this->assertTrue(Auth::check(), true);
    }

    /** @test */
    public function it_can_logout_of_the_application()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->visit(route('canvas.admin'));
        $this->click('Sign out');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin'))
            ->see(e('Sign In'));
    }
}
