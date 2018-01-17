<?php

namespace Tests;

use Auth;

class PostEditPageTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser, TestHelper;

    /** @test */
    public function it_can_edit_posts()
    {
        Auth::guard('canvas')->login($this->user);
        $this->callRouteAsUser('canvas.admin.post.edit', 1)
            ->submitForm('Update', ['title' => 'Foo'])
            ->see('Success! Post has been updated')
            ->see('Foo')
            ->seePostInDatabase();
        $this->actingAs($this->user)
            ->visit('/admin/post/1/edit')
            ->type('NewTitle', 'title')
            ->press('action');
    }

    /** @test */
    public function it_can_preview_a_post()
    {
        Auth::guard('canvas')->login($this->user);
        $this->callRouteAsUser('canvas.admin.post.edit', 1)
            ->click('permalink')
            ->seePageIs(route('canvas.blog.post.show', 'hello-world'))
            ->assertSessionMissing('errors');
    }

    /** @test */
    public function it_can_delete_a_post_from_the_database()
    {
        Auth::guard('canvas')->login($this->user);
        $this->callRouteAsUser('canvas.admin.post.edit', 1)
            ->press('Delete Post')
            ->see($this->getDeleteMessage())
            ->dontSeePostInDatabase(1)
            ->seePageIs(route('canvas.admin.post.index'))
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
