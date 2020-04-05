<?php

namespace Canvas\Tests\Unit\Http\Middleware;

use Canvas\Http\Middleware\Session;
use Canvas\Post;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SessionTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The middleware instance.
     *
     * @var Session
     */
    protected $instance;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->instance = new Session();
    }

    /** @test */
    public function prunes_expired_views_in_session()
    {
        $post_1 = factory(Post::class)->create();
        $key_1 = 'viewed_posts.'.$post_1->id;

        session()->put($key_1, now()->timestamp);

        $post_2 = factory(Post::class)->create();
        $key_2 = 'viewed_posts.'.$post_2->id;

        session()->put($key_2, now()->subHours(2)->timestamp);

        $this->invokeMethod($this->instance, 'pruneExpiredViews', [collect(session()->get('viewed_posts'))]);

        $this->assertArrayHasKey($post_1->id, session()->get('viewed_posts'));
        $this->assertArrayNotHasKey($post_2->id, session()->get('viewed_posts'));
    }

    /** @test */
    public function prunes_expired_visits_in_session()
    {
        $ip = '127.0.0.1';
        $post_1 = factory(Post::class)->create();
        $key_1 = 'visited_posts.'.$post_1->id;

        session()->put($key_1, [
            'timestamp' => now()->timestamp,
            'ip' => $ip,
        ]);

        $post_2 = factory(Post::class)->create();
        $key_2 = 'visited_posts.'.$post_2->id;

        session()->put($key_2, [
            'timestamp' => now()->subDay()->timestamp,
            'ip' => $ip,
        ]);

        $this->invokeMethod($this->instance, 'pruneExpiredVisits', [collect(session()->get('visited_posts'))]);

        $this->assertArrayHasKey($post_1->id, session()->get('visited_posts'));
        $this->assertArrayNotHasKey($post_2->id, session()->get('visited_posts'));
    }
}
