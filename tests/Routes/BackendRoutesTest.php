<?php

namespace Tests;

use Auth;

class AdminRoutesTest extends BrowserKitTestCase
{
    use InteractsWithDatabase, CreatesUser;

    /** @test */
    public function it_can_access_the_home_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin'));
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_posts_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.post.index'));
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_edit_posts_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.post.edit', 1));
        $this->assertEquals(200, $response->status());
        $this->assertViewHas(['id', 'title', 'slug', 'subtitle', 'page_image', 'content', 'meta_description', 'is_published', 'publish_date', 'publish_time', 'published_at', 'updated_at', 'layout', 'tags', 'allTags']);
    }

    /** @test */
    public function it_can_access_the_tags_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.tag.index'));
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_edit_tags_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.tag.edit', 1));
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_media_library_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.upload'));
        $this->assertEquals(200, $response->status());
    }

    /** @test */
    public function it_can_access_the_profile_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.profile.index'));
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_profile_privacy_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.profile.privacy'));
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_tools_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.tools'));
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_settings_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.settings'));
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_help_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.help'));
        $this->assertEquals(200, $response->status());
    }

    /** @test */
    public function it_can_access_the_users_index_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.user.index'));
        $this->assertEquals(200, $response->status());
    }

    /** @test */
    public function it_can_access_the_edit_users_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.user.edit', 2));
        $this->assertEquals(200, $response->status());
    }

    /** @test */
    public function it_can_access_the_edit_users_privacy_page()
    {
        Auth::guard('canvas')->login($this->user);
        $response = $this->actingAs($this->user)->call('GET', route('canvas.admin.user.privacy', 2));
        $this->assertEquals(200, $response->status());
    }
}
