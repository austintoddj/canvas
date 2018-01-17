<?php

namespace Tests;

use Auth;
use CanvasHelper;

class TagCreatePageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser, TestHelper;

    /** @test */
    public function it_can_press_cancel_to_return_to_the_tag_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.tag.create'))
            ->click('Cancel');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.tag.index'));
    }

    /** @test */
    public function it_validates_the_tag_create_form()
    {
        Auth::guard('canvas')->login($this->user);
        $this->callRouteAsUser('canvas.admin.tag.store', null, ['title' => 'example'])
            ->assertSessionHasErrors();
    }

    /** @test */
    public function it_can_create_a_tag_and_save_it_to_the_database()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)->post(route('canvas.admin.tag.store'), [
            'tag'               => 'example',
            'title'             => 'foo',
            'subtitle'          => 'bar',
            'meta_description'  => 'FooBar',
            'layout'            => config('blog.tag_layout'),
            'reverse_direction' => 0,
        ]);

        $this->seeInDatabase(CanvasHelper::TABLES['tags'], [
            'tag'               => 'example',
            'title'             => 'foo',
            'subtitle'          => 'bar',
            'meta_description'  => 'FooBar',
            'layout'            => config('blog.tag_layout'),
            'reverse_direction' => 0,
        ]);

        $this->assertSessionHas('_new-tag', trans('canvas::messages.create_success', ['entity' => 'tag']));
        $this->assertRedirectedTo(route('canvas.admin.tag.index'));
    }
}
