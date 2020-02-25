<?php

namespace Canvas\Tests\Listeners;

use Canvas\Listeners\CaptureVisit;
use Canvas\Post;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CaptureVisitTest extends TestCase
{
    use RefreshDatabase;

    /**
     * The listener instance.
     *
     * @var CaptureVisit
     */
    protected $instance;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->instance = new CaptureVisit();
    }

    /** @test */
    public function check_if_a_post_evaluates_unique_visits()
    {
        $post = factory(Post::class)->create();
        $ip = '127.0.0.1';

        $this->invokeMethod($this->instance, 'storeInSession', [$post, $ip]);

        $response = $this->invokeMethod($this->instance, 'visitIsUnique', [$post, $ip]);

        $this->assertFalse($response);
        $this->assertArrayHasKey($post->id, session()->get('visited_posts'));

        session()->flush();

        $response = $this->invokeMethod($this->instance, 'visitIsUnique', [$post, $ip]);

        $this->assertTrue($response);
    }

    /** @test */
    public function store_a_post_id_in_session()
    {
        $post = factory(Post::class)->create();
        $ip = '127.0.0.1';

        $this->invokeMethod($this->instance, 'storeInSession', [$post, $ip]);

        $this->assertArrayHasKey($post->id, session()->get('visited_posts'));
    }
}
