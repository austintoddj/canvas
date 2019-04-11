<?php

namespace Canvas\Tests\Listeners;

use Canvas\Models\Post;
use Canvas\Tests\TestCase;
use Illuminate\Support\Str;
use Canvas\Http\Middleware\ViewThrottle;

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
        $post1 = Post::create([
            'id'      => Str::uuid()->toString(),
            'title'   => 'Example Post 1',
            'slug'    => 'example-slug-1',
            'user_id' => 1,
        ]);

        $key1 = 'viewed_posts.'.$post1->id;

        session()->put($key1, now()->timestamp);

        $post2 = Post::create([
            'id'      => Str::uuid()->toString(),
            'title'   => 'Example Post 2',
            'slug'    => 'example-slug-2',
            'user_id' => 1,
        ]);

        $key2 = 'viewed_posts.'.$post2->id;

        session()->put($key2, now()->subHours(2)->timestamp);

        $this->invokeMethod($this->instance, 'pruneExpiredViews', [session()->get('viewed_posts')]);

        $this->assertArrayHasKey($post1->id, session()->get('viewed_posts'));
        $this->assertArrayNotHasKey($post2->id, session()->get('viewed_posts'));
    }
}
