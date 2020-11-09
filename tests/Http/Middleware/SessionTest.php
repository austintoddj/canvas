<?php

namespace Canvas\Tests\Http\Middleware;

use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

/**
 * Class SessionTest.
 *
 * @covers \Canvas\Http\Middleware\Session
 */
class SessionTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();

        Route::middleware([Session::class])->any('/_test/session', function () {
            return true;
        });
    }

    public function testOldVisitsArePrunedFromSession(): void
    {
        $recentPost = factory(Post::class)->create();
        $oldPost = factory(Post::class)->create();

        session()->put('visited_posts.'.$recentPost->id, [
            'timestamp' => now()->timestamp,
            'ip' => '127.0.0.1',
        ]);

        session()->put('visited_posts.'.$oldPost->id, [
            'timestamp' => now()->subDay()->timestamp,
            'ip' => '127.0.0.1',
        ]);

        $this->get('/_test/session')->assertSessionHas([
            "visited_posts.{$recentPost->id}",
        ])->assertSessionMissing([
            "visited_posts.{$oldPost->id}",
        ]);
    }

    public function testOldViewsArePrunedFromSession(): void
    {
        $recentPost = factory(Post::class)->create();
        $oldPost = factory(Post::class)->create();

        session()->put('viewed_posts.'.$recentPost->id, now()->timestamp);
        session()->put('viewed_posts.'.$oldPost->id, now()->subHours(2)->timestamp);

        $this->get('/_test/session')->assertSessionHas([
            "viewed_posts.{$recentPost->id}",
        ])->assertSessionMissing([
            "viewed_posts.{$oldPost->id}",
        ]);
    }
}
