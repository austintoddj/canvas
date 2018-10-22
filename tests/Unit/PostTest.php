<?php

namespace Canvas\Tests\Unit;

use Canvas\Entities\Post;
use Canvas\Tests\TestCase;
use Canvas\Interfaces\PostInterface;

class PostTest extends TestCase
{
    /**
     * @return void
     */
    public function setUp()
    {
        parent::setUp();
    }

    /** @test */
    public function it_can_create_a_published_post()
    {
        $post = Post::create([
            'user_id' => $this->testUser->id,
            'title' => 'example',
            'summary' => '',
            'body' => '',
            'slug' => '',
            'published_at' => now()->toDateTimeString(),
        ]);

        $this->assertNotNull(Post::where('title', $post->title));
        $this->assertEquals(true, $post->published);
    }

    /** @test */
    public function it_is_retrievable_by_id()
    {
        $post_by_id = Post::find($this->testPost->id);

        $this->assertEquals($this->testPost->id, $post_by_id->id);
    }

    /** @test */
    public function is_can_retrieve_all_posts_for_a_user()
    {
        Post::create([
            'user_id' => $this->testUser->id,
            'title' => 'User Post',
            'summary' => '',
            'body' => '',
            'slug' => '',
            'published_at' => now()->toDateTimeString(),
        ]);

        $this->assertCount(2, app(PostInterface::class)->getByUserId($this->testUser->id));
    }
}
