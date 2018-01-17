<?php

namespace Tests;

use Auth;
use Carbon\Carbon;

class PostCreatePageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser, TestHelper;

    /** @test */
    public function it_can_press_cancel_to_return_to_the_post_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $this->actingAs($this->user)
            ->visit(route('canvas.admin.post.create'))
            ->click('Cancel');
        $this->assertSessionMissing('errors');
        $this->seePageIs(route('canvas.admin.post.index'));
    }

    /** @test */
    public function it_validates_the_post_create_form()
    {
        Auth::guard('canvas')->login($this->user);
        $this->callRouteAsUser('canvas.admin.post.store', null, ['title' => 'example'])
            ->assertSessionHasErrors();
    }

    /** @test */
    public function it_can_create_a_post_and_save_it_to_the_database()
    {
        $data = [
            'id'            => 2,
            'user_id'       => 1,
            'title'         => 'example',
            'slug'          => 'foo',
            'subtitle'      => 'bar',
            'content'       => 'FooBar',
            'published_at'  =>  Carbon::now(),
            'layout'        => config('blog.post_layout'),
        ];

        Auth::guard('canvas')->login($this->user);
        $this->callRouteAsUser('canvas.admin.post.store', null, $data)
            ->seePostInDatabase(['title' => 'example', 'content_raw' => 'FooBar', 'content_html' => '<p>FooBar</p>'])
            ->seeInSession('_new-post', trans('canvas::messages.create_success', ['entity' => 'post']))
            ->assertRedirectedTo(route('canvas.admin.post.edit', 2))
            ->assertSessionMissing('errors');
    }

    /**
     * Get the post deletion success message.
     *
     * @return string
     */
    protected function getDeleteMessage()
    {
        return 'Success! Post has been deleted.';
    }
}
