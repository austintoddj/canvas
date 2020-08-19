<?php

namespace Canvas\Tests\Models;

use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\UserMeta;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Canvas\Tests\TestCase;
use Carbon\Carbon;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

/**
 * Class PostTest.
 *
 * @covers \Canvas\Models\Post
 */
class PostTest extends TestCase
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
            sprintf('%d %s %s', $minutes, Str::plural(trans('canvas::app.min'), $minutes), trans('canvas::app.read'))
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

        $postOne = factory(Post::class)->create();
        $response = $this->actingAs($postOne->user)->postJson("/canvas/api/posts/{$postOne->id}", $data);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);

        $postTwo = factory(Post::class)->create();
        $response = $this->actingAs($postTwo->user)->postJson("/canvas/api/posts/{$postTwo->id}", $data);

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

    /** @test */
    public function it_will_detach_tags_and_topic_on_delete()
    {
        $tag = factory(Tag::class)->create();
        $topic = factory(Topic::class)->create();
        $post = factory(Post::class)->create();

        $post->topic()->sync([$topic->id]);
        $post->tags()->sync([$tag->id]);

        $post->delete();

        $this->assertEquals(0, $post->tags->count());
        $this->assertEquals(0, $post->topic->count());
        $this->assertDatabaseMissing('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);
        $this->assertDatabaseMissing('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $topic->id,
        ]);
    }
}
