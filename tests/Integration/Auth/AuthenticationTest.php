<?php

namespace Tests;

use Auth;

class AuthenticationTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_validates_the_login_form()
    {
        $this->visit(route('canvas.admin'))
            ->type('foo@bar.com', 'email')
            ->type('secret', 'password')
            ->press('submit')
            ->dontSeeIsAuthenticated()
            ->seePageIs(route('canvas.admin'));
        $this->see('These credentials do not match our records.');
    }

    /** @test */
    public function it_can_login_to_the_application()
    {
        $this->visit(route('canvas.admin'))
             ->type($this->user->email, 'email')
             ->type('password', 'password')
             ->press('submit')
             ->seeIsAuthenticatedAs($this->user)
             ->seePageIs(route('canvas.admin'));
        $this->see('Welcome back');
    }

    /** @test */
    public function it_can_logout_of_the_application()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
             ->visit(route('canvas.admin'))
             ->click('logout')
             ->seePageis(route('canvas.admin'))
             ->dontSeeIsAuthenticated();
    }
}
