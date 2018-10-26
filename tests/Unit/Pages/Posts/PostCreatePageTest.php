<?php

namespace Tests\Unit\Pages\Posts;

use Carbon\Carbon;
use Tests\TestCase;
use Tests\TestHelper;
use Tests\CreatesUser;
use Illuminate\Http\Response;
use Tests\InteractsWithDatabase;

class PostCreatePageTest extends TestCase
{
    use InteractsWithDatabase, TestHelper, CreatesUser;

    /**
     * Get the successful create message for a post.
     *
     * @return string
     */
    protected function getCreateMessage()
    {
        return trans('canvas::messages.create_success', ['entity' => 'post']);
    }

    /** @test */
    public function it_can_press_cancel_to_return_to_the_post_index_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)
            ->visit(route('canvas.admin.post.create'))
            ->click('Cancel');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.post.index'))
            ->see(e('Posts'));
    }

    /** @test */
    public function it_validates_the_post_create_form()
    {
        // Actions
        $this->createUser()->callRouteAsUser('canvas.admin.post.store', null, ['title' => 'example']);
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

        // Actions
        $this->createUser()->callRouteAsUser('canvas.admin.post.store', null, $data)

            // Assertions
            ->seePostInDatabase([
                'title' => 'example',
                'content_raw' => 'FooBar',
                'content_html' => '<p>FooBar</p>',
            ])
            ->assertRedirectedTo(route('canvas.admin.post.edit', 2))
            ->seeInSession('_new-post', self::getCreateMessage())
    }
}
