<?php

namespace Canvas\Tests\Listeners;

use Canvas\Events\PostViewed;
use Canvas\Listeners\CaptureVisit;
use Canvas\Models\Post;
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
    public function it_can_capture_a_visit()
    {
        $post = factory(Post::class)->create();

        $event = new PostViewed($post);

        $listener = new CaptureVisit();

        $listener->handle($event);

        $this->assertDatabaseHas('canvas_visits', [
            'post_id' => $post->id,
        ]);
    }

    /** @test */
    public function it_can_check_if_visit_is_unique()
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
    public function it_can_store_post_in_session()
    {
        $post = factory(Post::class)->create();

        $ip = '127.0.0.1';

        $this->invokeMethod($this->instance, 'storeInSession', [$post, $ip]);

        $this->assertArrayHasKey($post->id, session()->get('visited_posts'));
    }
}
