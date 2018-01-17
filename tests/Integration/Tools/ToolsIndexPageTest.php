<?php

namespace Tests;

use Auth;

class ToolsIndexPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_refresh_the_tools_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.tools'))
            ->click('Refresh Tools');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.tools'));
    }

    /** @test */
    public function it_can_clear_the_application_cache()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.tools'))
            ->click('Clear Cache');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.tools'));
    }

    /** @test */
    public function it_can_enable_maintenance_mode()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.tools'))
            ->press('maintenance_mode')
            ->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.tools'));
        $this->see('Success! The application is now in maintenance mode.');
    }

    /** @test */
    public function it_displays_the_503_maintenance_mode_page_while_app_is_down()
    {
        $response = $this->call('GET', route('canvas.home'));
        $this->assertEquals(503, $response->status());
    }

    /** @test */
    public function it_can_disable_maintenance_mode()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.tools'))
            ->press('maintenance_mode')
            ->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.tools'));
        $this->see('Success! The application is now in active mode.');
    }

    /** @test */
    public function it_removes_the_503_maintenance_mode_page_while_app_is_up()
    {
        $response = $this->call('GET', route('canvas.home'));
        $this->assertEquals(200, $response->status());
    }

    /** @test */
    public function it_can_download_the_archive_data()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)->visit(route('canvas.admin.tools'))->see('Download Archive');
    }

    /** @test */
    public function it_cannot_access_the_tools_page_if_user_is_not_an_admin()
    {
        Auth::guard('canvas')->login($this->user);
        $this->user['role'] = 0;
        $this->actingAs($this->user)->visit(route('canvas.admin.tools'));
        $this->seePageIs(route('canvas.admin'));
        $this->assertSessionMissing('errors');
    }
}
