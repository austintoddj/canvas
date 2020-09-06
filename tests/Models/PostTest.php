<?php

namespace Canvas\Tests\Models;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Canvas\Tests\TestCase;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
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

    /** @test */
    public function dates_are_carbon_objects()
    {
        $this->assertInstanceOf(Carbon::class, factory(Post::class)->create()->published_at);
    }

    /** @test */
    public function read_time_appends_to_the_model()
    {
        $this->assertArrayHasKey('read_time', factory(Post::class)->create()->toArray());
    }

    /** @test */
    public function meta_is_cast_to_an_array()
    {
        $this->assertIsArray(factory(Post::class)->create()->meta);
    }

    /** @test */
    public function published_attribute()
    {
        $this->assertTrue(factory(Post::class)->create([
            'published_at' => now()->subDay(),
        ])->published);
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
    public function top_referers_attribute()
    {
        $post = factory(Post::class)->create();

        factory(View::class, 1)->create([
            'post_id' => $post->id,
            'referer' => null,
            'created_at' => now()->subHour(),
        ]);

        factory(View::class, 1)->create([
            'post_id' => $post->id,
            'created_at' => now()->subHours(2),
        ]);

        $this->assertCount(2, $post->topReferers);
        $this->assertIsArray($post->topReferers);
    }

    /** @test */
    public function posts_can_share_the_same_slug_with_unique_users()
    {
        $data = [
            'slug' => 'a-new-post',
        ];

        $postOne = factory(Post::class)->create();
        $response = $this->actingAs($postOne->user, 'canvas')->postJson("/canvas/api/posts/{$postOne->id}", $data);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);

        $postTwo = factory(Post::class)->create();
        $response = $this->actingAs($postTwo->user, 'canvas')->postJson("/canvas/api/posts/{$postTwo->id}", $data);

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

        $this->assertInstanceOf(BelongsToMany::class, $post->tags());
        $this->assertInstanceOf(Tag::class, $post->tags->first());
    }

    /** @test */
    public function topic_relationship()
    {
        $post = factory(Post::class)->create();
        $topic = factory(Topic::class)->create();

        $post->topic()->sync($topic);

        $this->assertInstanceOf(BelongsToMany::class, $post->topic());
        $this->assertInstanceOf(Topic::class, $post->topic->first());
    }

    /** @test */
    public function user_relationship()
    {
        $post = factory(Post::class)->create();

        $this->assertInstanceOf(BelongsTo::class, $post->user());
        $this->assertInstanceOf(User::class, $post->user);
    }

    /** @test */
    public function views_relationship()
    {
        $post = factory(Post::class)->create();

        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $this->assertInstanceOf(HasMany::class, $post->views());
        $this->assertInstanceOf(View::class, $post->views->first());
    }

    /** @test */
    public function visits_relationship()
    {
        $post = factory(Post::class)->create();

        factory(Visit::class)->create([
            'post_id' => $post->id,
        ]);

        $this->assertInstanceOf(HasMany::class, $post->visits());
        $this->assertInstanceOf(Visit::class, $post->visits->first());
    }

    /** @test */
    public function published_scope()
    {
        $user = factory(User::class)->create();

        factory(Post::class)->create([
            'user_id' => $user->id,
            'published_at' => now()->subDay(),
        ]);

        $this->assertInstanceOf(Builder::class, resolve(Post::class)->published());
        $this->assertCount(1, Post::published()->get());
    }

    /** @test */
    public function draft_scope()
    {
        $user = factory(User::class)->create();

        factory(Post::class)->create([
            'user_id' => $user->id,
            'published_at' => now()->addDay(),
        ]);

        $this->assertInstanceOf(Builder::class, resolve(Post::class)->draft());
        $this->assertCount(1, Post::draft()->get());
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
