<?php

namespace Tests;

use Auth;

class TagIndexPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_refresh_the_tag_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.tag.index'))
            ->click('Refresh Tags');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.tag.index'));
    }

    /** @test */
    public function it_can_add_a_tag_from_the_tag_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.tag.index'))
            ->click('create-tag');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.tag.create'));
    }
}
