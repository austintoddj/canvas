<?php

namespace Tests\Unit\Pages\Posts;

use Tests\TestCase;
use Tests\TestHelper;
use Tests\CreatesUser;
use Illuminate\Http\Response;
use Tests\InteractsWithDatabase;

class PostEditPageTest extends TestCase
{
    use InteractsWithDatabase, TestHelper, CreatesUser;

    /**
     * Get the successful delete message for a post.
     *
     * @return string
     */
    protected function getDeleteMessage()
    {
        return trans('canvas::messages.delete_success', ['entity' => 'post']);
    }

    /** @test */
    public function it_can_edit_posts()
    {
        // Actions
        $this->createUser()->callRouteAsUser('canvas.admin.post.edit', 1)
            ->submitForm('Update', ['title' => 'Foo'])

            // Assertions
            ->see(e('Success! Post has been updated'))
            ->see(e('Foo'))
            ->seePostInDatabase()
            ->assertSessionMissing('errors');
        $this->assertResponseStatus(Response::HTTP_OK);
    }

    /** @test */
    public function it_can_preview_a_post()
    {
        // Actions
        $this->createUser()->callRouteAsUser('canvas.admin.post.edit', 1)
            ->click('permalink')

            // Assertions
            ->seePageIs(route('canvas.blog.post.show', 'hello-world'))
            ->assertSessionMissing('errors');
        $this->assertResponseStatus(Response::HTTP_OK);
    }

    /** @test */
    public function it_can_delete_a_post_from_the_database()
    {
        // Actions
        $this->createUser()->callRouteAsUser('canvas.admin.post.edit', 1)
            ->press('Delete Post')

            // Assertions
            ->see(self::getDeleteMessage())
            ->dontSeePostInDatabase(1)
            ->seePageIs(route('canvas.admin.post.index'))
            ->assertSessionMissing('errors');
        $this->assertResponseStatus(Response::HTTP_OK);
    }
}
