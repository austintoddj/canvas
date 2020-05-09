<?php

namespace Canvas\Tests;

use Canvas\Http\Middleware\Session;
use Canvas\Post;
use Canvas\Visit;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

class VisitTest extends TestCase
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

        factory(Visit::class)->create([
            'post_id' => $post->id,
        ]);

        $this->assertCount(1, $post->visits);
        $this->assertInstanceOf(Visit::class, $post->visits->first());
    }

    /** @test */
    public function for_posts_in_range_scope()
    {
        $post = factory(Post::class)->create();

        $post->visits()->create([
            'post_id' => $post->id,
            'created_at' => now()->subMonth(),
        ]);

        $post->visits()->createMany(
            factory(Visit::class, 2)->make()->toArray()
        );

        $this->assertEquals(2, Visit::forPostsInRange(
            [$post->id],
            now()->subWeek()->toDateTimeString(),
            now()->endOfDay()->toDateTimeString())->count()
        );
    }
}
