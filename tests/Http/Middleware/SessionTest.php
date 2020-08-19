<?php

namespace Canvas\Tests\Http\Middleware;

use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class SessionTest.
 *
 * @covers \Canvas\Http\Middleware\Session
 */
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
    public function it_can_prune_expired_views()
    {
        $recent = factory(Post::class)->create();

        session()->put('viewed_posts.'.$recent->id, now()->timestamp);

        $old = factory(Post::class)->create();

        session()->put('viewed_posts.'.$old->id, now()->subHour()->subMinute()->timestamp);

        $this->invokeMethod($this->instance, 'pruneExpiredViews', [collect(session()->get('viewed_posts'))]);

        $this->assertArrayHasKey($recent->id, session()->get('viewed_posts'));
        $this->assertArrayNotHasKey($old->id, session()->get('viewed_posts'));
    }

    /** @test */
    public function it_can_prune_expired_visits()
    {
        $ip = '127.0.0.1';

        $recent = factory(Post::class)->create();

        session()->put('visited_posts.'.$recent->id, [
            'timestamp' => now()->timestamp,
            'ip' => $ip,
        ]);

        $old = factory(Post::class)->create();

        session()->put('visited_posts.'.$old->id, [
            'timestamp' => now()->subDay()->timestamp,
            'ip' => $ip,
        ]);

        $this->invokeMethod($this->instance, 'pruneExpiredVisits', [collect(session()->get('visited_posts'))]);

        $this->assertArrayHasKey($recent->id, session()->get('visited_posts'));
        $this->assertArrayNotHasKey($old->id, session()->get('visited_posts'));
    }
}
