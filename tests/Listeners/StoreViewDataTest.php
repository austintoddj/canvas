<?php

namespace Canvas\Tests\Listeners;

use Canvas\Post;
use Canvas\Tests\TestCase;
use Illuminate\Support\Str;
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
    public function it_returns_true_if_a_post_was_recently_viewed()
    {
        $post = Post::create([
            'id'      => Str::uuid()->toString(),
            'title'   => 'Example Post',
            'slug'    => 'example-slug',
            'user_id' => 1,
        ]);

        $key = 'viewed_posts.'.$post->id;

        session()->put($key, time());

        $response = $this->invokeMethod($this->instance, 'wasRecentlyViewed', ['post' => $post]);

        $this->assertTrue($response);
        $this->assertArrayHasKey($post->id, session()->get('viewed_posts'));
    }

    /** @test */
    public function it_returns_false_if_a_post_was_not_recently_viewed()
    {
        session()->put('viewed_posts', []);

        $post = Post::create([
            'id'      => Str::uuid()->toString(),
            'title'   => 'Example Post',
            'slug'    => 'example-slug',
            'user_id' => 1,
        ]);

        $response = $this->invokeMethod($this->instance, 'wasRecentlyViewed', ['post' => $post]);

        $this->assertFalse($response);
    }

    /** @test */
    public function it_stores_a_post_id_in_session()
    {
        $post = Post::create([
            'id'      => Str::uuid()->toString(),
            'title'   => 'Example Post',
            'slug'    => 'example-slug',
            'user_id' => 1,
        ]);

        $this->invokeMethod($this->instance, 'storeInSession', ['post' => $post]);

        $this->assertArrayHasKey($post->id, session()->get('viewed_posts'));
    }
}
