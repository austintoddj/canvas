<?php

class AdminRoutesTest extends TestCase
{
    use InteractsWithDatabase;

    /**
     * The user model.
     *
     * @var App\Models\User
     */
    private $user;

    /**
     * Create the user model test subject.
     *
     * @before
     * @return void
     */
    public function createUser()
    {
        $this->user = factory(App\Models\User::class)->create();
    }

    /** @test */
    public function it_can_access_the_home_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin');
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_posts_index_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/post');
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_edit_posts_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/post/1/edit');
        $this->assertEquals(200, $response->status());
        $this->assertViewHas(['id', 'title', 'slug', 'subtitle', 'page_image', 'content', 'meta_description', 'is_draft', 'publish_date', 'publish_time', 'published_at', 'updated_at', 'layout', 'tags', 'allTags']);
    }

    /** @test */
    public function it_can_access_the_tags_index_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/tag');
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_edit_tags_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/tag/1/edit');
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_media_library_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/upload');
        $this->assertEquals(200, $response->status());
    }

    /** @test */
    public function it_can_access_the_profile_index_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/profile');
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_edit_profile_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/profile/'.$this->user['id'].'/edit');
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_profile_privacy_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/profile/privacy');
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_tools_index_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/tools');
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_settings_index_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/settings');
        $this->assertEquals(200, $response->status());
        $this->assertViewHasAll(['data']);
    }

    /** @test */
    public function it_can_access_the_help_index_page()
    {
        $response = $this->actingAs($this->user)->call('GET', '/admin/help');
        $this->assertEquals(200, $response->status());
    }
}
