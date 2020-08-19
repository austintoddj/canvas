<?php

namespace Canvas\Tests\Models;

use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Models\Visit;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class VisitTest.
 *
 * @covers \Canvas\Models\Visit
 */
class VisitTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([
            Authorize::class,
            Session::class,
            VerifyCsrfToken::class,
        ]);
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
}
