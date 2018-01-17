<?php

namespace Tests;

use Auth;

class MediaIndexPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_refresh_the_media_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.upload'))
            ->click('Refresh Media');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.upload'));
    }
}
