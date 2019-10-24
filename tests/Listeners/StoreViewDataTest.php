<?php

namespace Canvas\Tests\Listeners;

use Canvas\Post;
use Canvas\Tests\TestCase;
use Canvas\Listeners\StoreViewData;

class StoreViewDataTest extends TestCase
{
    /**
     * The listener instance.
     *
     * @var StoreViewData
     */
    protected $instance;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->instance = new StoreViewData();
    }

    /** @test */
    public function check_if_a_post_was_recently_viewed()
    {
        $post = factory(Post::class)->create();

        $key = 'viewed_posts.'.$post->id;

        session()->put($key, time());

        $response = $this->invokeMethod($this->instance, 'wasRecentlyViewed', ['post' => $post]);

        $this->assertTrue($response);
        $this->assertArrayHasKey($post->id, session()->get('viewed_posts'));

        session()->flush();

        $response = $this->invokeMethod($this->instance, 'wasRecentlyViewed', ['post' => $post]);

        $this->assertFalse($response);
    }

    /** @test */
    public function store_a_post_id_in_session()
    {
        $post = factory(Post::class)->create();

        $this->invokeMethod($this->instance, 'storeInSession', ['post' => $post]);

        $this->assertArrayHasKey($post->id, session()->get('viewed_posts'));
    }
}
