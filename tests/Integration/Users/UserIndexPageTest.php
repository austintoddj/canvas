<?php

namespace Tests;

use Auth;

class UserIndexPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_refresh_the_user_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.user.index'))
            ->click('Refresh Users');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.user.index'));
    }

    /** @test */
    public function it_can_add_a_user_from_the_user_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.user.index'))
            ->click('create-user');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.user.create'));
    }

    /** @test */
    public function it_cannot_access_the_user_index_page_if_user_is_not_an_admin()
    {
        Auth::guard('canvas')->login($this->user);
        $this->user['role'] = 0;
        $this->actingAs($this->user)->visit(route('canvas.admin.user.index'));
        $this->seePageIs(route('canvas.admin'));
        $this->assertSessionMissing('errors');
    }
}
