<?php

namespace Tests;

use Auth;

class HomeIndexPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_preview_the_blog_from_the_home_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin'))
            ->click('View Site');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.home'));
    }

    /** @test */
    public function it_displays_all_cards_if_user_is_an_admin()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin'))
            ->see('Welcome to Canvas!')
            ->see('At a Glance');
        $this->assertSessionMissing('errors');
    }

    /** @test */
    public function it_does_not_display_all_cards_if_user_is_not_an_admin()
    {
        Auth::guard('canvas')->login($this->user);
        $this->user['role'] = 0;
        $this->actingAs($this->user)
            ->visit(route('canvas.admin'))
            ->dontSee('Welcome to Canvas!')
            ->dontSee('At a Glance');
        $this->assertSessionMissing('errors');
    }
}
