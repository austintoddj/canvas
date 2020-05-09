<?php

namespace Canvas\Tests;

use Canvas\Http\Middleware\Session;
use Canvas\Post;
use Canvas\Tag;
use Canvas\Topic;
use Canvas\UserMeta;
use Canvas\View;
use Canvas\Visit;
use Carbon\Carbon;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

class PostTest extends TestCase
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
    public function dates_are_carbon_objects()
    {
        $post = factory(Post::class)->create();

        $this->assertInstanceOf(Carbon::class, $post->published_at);
    }

    /** @test */
    public function read_time_appends_to_the_model()
    {
        $post = factory(Post::class)->create();

        $this->assertArrayHasKey('read_time', $post->toArray());
    }

    /** @test */
    public function meta_is_cast_to_an_array()
    {
        $post = factory(Post::class)->create();

        $this->assertIsArray($post->meta);
    }

    /** @test */
    public function published_attribute()
    {
        $post = factory(Post::class)->create([
            'published_at' => now()->subDay(),
        ]);

        $this->assertTrue($post->published);
    }

    /** @test */
    public function read_time_attribute()
    {
        $post = factory(Post::class)->create();

        $minutes = ceil(str_word_count($post->body) / 250);

        $this->assertEquals(
            $post->readTime,
            sprintf('%d %s %s', $minutes, Str::plural(__('canvas::app.min'), $minutes), __('canvas::app.read'))
        );
    }

    /** @test */
    public function popular_reading_times_attribute()
    {
        $post = factory(Post::class)->create();

        factory(View::class, 1)->create([
            'post_id' => $post->id,
            'created_at' => now()->subHour(),
        ]);

        factory(View::class, 1)->create([
            'post_id' => $post->id,
            'created_at' => now()->addHour(),
        ]);

        $this->assertCount(2, $post->popularReadingTimes);
        $this->assertIsArray($post->popularReadingTimes);
    }

    /** @test */
    public function posts_can_share_the_same_slug_with_unique_users()
    {
        $data = [
            'slug' => 'a-new-post',
        ];

        $post_1 = factory(Post::class)->create();
        $response = $this->actingAs($post_1->user)->postJson("/canvas/api/posts/{$post_1->id}", $data);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);

        $post_2 = factory(Post::class)->create();
        $response = $this->actingAs($post_2->user)->postJson("/canvas/api/posts/{$post_2->id}", $data);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);
    }

    /** @test */
    public function tags_relationship()
    {
        $post = factory(Post::class)->create();
        $tag = factory(Tag::class)->create();

        $post->tags()->sync($tag);

        $this->assertInstanceOf(Tag::class, $post->tags->first());
    }

    /** @test */
    public function topic_relationship()
    {
        $post = factory(Post::class)->create();
        $topic = factory(Topic::class)->create();

        $post->topic()->sync($topic);

        $this->assertInstanceOf(Topic::class, $post->topic->first());
    }

    /** @test */
    public function user_relationship()
    {
        $post = factory(Post::class)->create();

        $this->assertInstanceOf(config('canvas.user'), $post->user);
    }

    /** @test */
    public function userMeta_relationship()
    {
        $post = factory(Post::class)->create();

        factory(UserMeta::class)->create([
            'user_id' => $post->user->id,
        ]);

        $this->assertInstanceOf(UserMeta::class, $post->userMeta);
    }

    /** @test */
    public function views_relationship()
    {
        $post = factory(Post::class)->create();

        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $this->assertInstanceOf(View::class, $post->views->first());
    }

    /** @test */
    public function visits_relationship()
    {
        $post = factory(Post::class)->create();

        factory(Visit::class)->create([
            'post_id' => $post->id,
        ]);

        $this->assertInstanceOf(Visit::class, $post->visits->first());
    }

    /** @test */
    public function for_user_scope()
    {
        $user = factory(config('canvas.user'))->create();

        $post = factory(Post::class)->create([
            'user_id' => $user->id,
        ]);

        $this->assertEquals(1, $post->forUser($user)->count());
    }

    /** @test */
    public function with_user_meta_scope()
    {
        $user = factory(config('canvas.user'))->create();

        $post = factory(Post::class)->create([
            'user_id' => $user->id,
        ]);

        $meta = factory(UserMeta::class)->create([
            'user_id' => $user->id,
        ]);

        $this->assertSame($meta->id, $post->withUserMeta()->first()->userMeta->id);
        $this->assertInstanceOf(UserMeta::class, Post::all()->first()->userMeta);
    }
}
