<?php

namespace Tests\Unit\Routes;

use Tests\TestCase;
use Tests\CreatesUser;
use Illuminate\Http\Response;
use Tests\InteractsWithDatabase;

class BackendRoutesTest extends TestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_access_the_home_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin'))
            ->see(e($this->user->display_name))
            ->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_posts_index_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.post.index'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.post.index'))
            ->see(e('Posts'))
            ->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_edit_posts_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.post.edit', 1));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.post.edit', 1))
            ->see(e('Edit Post'))
            ->assertViewHas(['id', 'title', 'slug', 'subtitle', 'page_image', 'content', 'meta_description', 'is_published', 'publish_date', 'publish_time', 'published_at', 'updated_at', 'layout', 'tags', 'allTags']);
    }

    /** @test */
    public function it_can_access_the_tags_index_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.tag.index'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.tag.index'))
            ->see(e('Tags'))
            ->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_edit_tags_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.tag.edit', 1));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.tag.edit', 1))
            ->see(e('Edit Tag'))
            ->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_media_library_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.upload'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.upload'))
            ->see(e('Media Library'));
    }

    /** @test */
    public function it_can_access_the_profile_index_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.profile.index'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.profile.index'))
            ->see(e($this->user->display_name))
            ->see(e('Profile'))
            ->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_profile_privacy_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.profile.privacy'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.profile.privacy'))
            ->see(e('Privacy'))
            ->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_tools_index_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.tools'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.tools'))
            ->see(e('Tools'))
            ->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_settings_index_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.settings'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.settings'))
            ->see(e('Settings'))
            ->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_help_index_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.help'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.help'))
            ->see(e('Help'));
    }

    /** @test */
    public function it_can_access_the_users_index_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.user.index'));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.user.index'))
            ->see(e($this->user->display_name))
            ->see(e('Users'));
    }

    /** @test */
    public function it_can_access_the_edit_users_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.user.edit', 2));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.user.edit', 2))
            ->see(e('Edit User'));
    }

    /** @test */
    public function it_can_access_the_edit_users_privacy_page()
    {
        // Actions
        $this->createUser()->actingAs($this->user)->call('GET', route('canvas.admin.user.privacy', 2));

        // Assertions
        $this->assertResponseStatus(Response::HTTP_OK)
            ->seePageIs(route('canvas.admin.user.privacy', 2))
            ->see(e('Privacy'));
    }
}
