<?php

namespace Canvas\Tests;

use Canvas\Http\Middleware\Session;
use Canvas\Post;
use Canvas\View;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ViewTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([Authorize::class, Session::class, VerifyCsrfToken::class]);
    }

    /** @test */
    public function post_relationship()
    {
        $post = factory(Post::class)->create();

        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $this->assertCount(1, $post->views);
        $this->assertInstanceOf(View::class, $post->views->first());
    }

    /** @test */
    public function for_posts_in_range_scope()
    {
        $post = factory(Post::class)->create();

        $post->views()->create([
            'post_id' => $post->id,
            'created_at' => now()->subMonth(),
        ]);

        $post->views()->createMany(
            factory(View::class, 2)->make()->toArray()
        );

        $this->assertEquals(2, View::forPostsInRange(
            [$post->id],
            now()->subWeek()->toDateTimeString(),
            now()->endOfDay()->toDateTimeString())->count()
        );
    }
}
