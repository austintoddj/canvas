<?php

namespace Tests;

use Auth;

class ProfilePrivacyPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser, TestHelper;

    /** @test */
    public function it_can_refresh_the_profile_privacy_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.profile.privacy'))
            ->click('Refresh Profile');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.profile.index'));
    }

    /** @test */
    public function it_validates_the_current_password()
    {
        Auth::guard('canvas')->login($this->user);
        $this->callRouteAsUser('canvas.admin.profile.privacy', 1)
            ->submitForm('Save', [
                'password' => 'wrongPass',
                'new_password' => 'newPass',
                'new_password_confirmation' => 'newPass'
            ]);

        $this->see('These credentials do not match our records.');
    }

    /** @test */
    public function it_can_update_the_password()
    {
        Auth::guard('canvas')->login($this->user);
        $this->callRouteAsUser('canvas.admin.profile.privacy', 1)
            ->submitForm('Save', [
                'password' => 'password',
                'new_password' => 'newPass',
                'new_password_confirmation' => 'newPass'
            ]);

        $this->see('Success! Your password has been updated.');

        $this->assertSessionMissing('errors');
        $this->assertTrue(Auth::validate([
            'email'    => $this->user->email,
            'password' => 'newPass',
        ]));
    }
}
