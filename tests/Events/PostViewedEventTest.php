<?php

namespace Canvas\Tests\Events;

use Canvas\Events\PostViewed;
use Canvas\Models\Post;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class PostViewedEventTest.
 *
 * @covers \Canvas\Events\PostViewed
 */
class PostViewedEventTest extends TestCase
{
    use RefreshDatabase;

    public function testInstantiation(): void
    {
        $post = factory(Post::class)->create();

        $event = new PostViewed($post);

        $this->assertInstanceOf(PostViewed::class, $event);
        $this->assertSame($post, $event->post);
    }
}
