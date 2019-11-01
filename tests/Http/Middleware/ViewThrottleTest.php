<?php

namespace Canvas\Tests\Middleware;

use Canvas\Http\Middleware\ViewThrottle;
use Canvas\Post;
use Canvas\Tests\TestCase;

class ViewThrottleTest extends TestCase
{
    /**
     * The middleware instance.
     *
     * @var ViewThrottle
     */
    protected $instance;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->instance = new ViewThrottle();
    }

    /** @test */
    public function filter_expired_views_in_session()
    {
        $post_1 = factory(Post::class)->create();
        $key_1 = 'viewed_posts.'.$post_1->id;

        session()->put($key_1, now()->timestamp);

        $post_2 = factory(Post::class)->create();
        $key_2 = 'viewed_posts.'.$post_2->id;

        session()->put($key_2, now()->subHours(2)->timestamp);

        $this->invokeMethod($this->instance, 'pruneExpiredViews', [session()->get('viewed_posts')]);

        $this->assertArrayHasKey($post_1->id, session()->get('viewed_posts'));
        $this->assertArrayNotHasKey($post_2->id, session()->get('viewed_posts'));
    }
}
