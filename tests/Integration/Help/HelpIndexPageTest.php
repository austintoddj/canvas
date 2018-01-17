<?php

namespace Tests;

use Auth;

class HelpIndexPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_refresh_the_user_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.help'))
            ->click('Refresh Help');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.help'));
    }
}
