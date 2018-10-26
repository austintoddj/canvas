<?php

namespace Tests\Unit\Pages\Posts;

use Carbon\Carbon;
use Tests\TestCase;
use Tests\CreatesUser;
use Illuminate\Http\Response;
use Tests\InteractsWithDatabase;

class PostIndexPageTest extends TestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_refresh_the_post_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)
            ->visit(route('canvas.admin.post.index'))
            ->click('Refresh Posts');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.post.index'))
            ->see(e('Posts'));
    }

    /** @test */
    public function it_can_add_a_post_from_the_post_index_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)
            ->visit(route('canvas.admin.post.index'))
            ->click('create-post');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.post.create'))
            ->see(e('Create a New Post'));
    }

    /** @test */
    public function it_applies_a_draft_label_to_a_non_published_post()
    {
        // Actions
        $this->createUser()->actingAs($this->user)
            ->visit(route('canvas.admin'))
            ->type('example', 'title')
            ->type('foo', 'slug')
            ->type('bar', 'subtitle')
            ->type('FooBar', 'content')
            ->type('example', 'title')
            ->type(Carbon::now(), 'published_at')
            ->type(config('blog.post_layout'), 'layout')
            ->check('is_published')
            ->press('Save');

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK);
        $this->assertSessionMissing('errors');
        $this->visit(route('canvas.admin.post.index'))
            ->see('<td>&lt;span class="label label-primary"&gt;Published&lt;/span&gt;</td>');
    }
}
