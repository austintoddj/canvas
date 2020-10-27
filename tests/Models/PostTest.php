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

    public function testDatesAreCarbonObjects(): void
    {
        $this->assertInstanceOf(Carbon::class, factory(Post::class)->create()->published_at);
    }

    public function testReadTimeAppendsToTheModel(): void
    {
        $this->assertArrayHasKey('read_time', factory(Post::class)->create()->toArray());
    }

    public function testMetaIsCastToArray(): void
    {
        $this->assertIsArray(factory(Post::class)->create()->meta);
    }

    public function testPublishedAttribute(): void
    {
        $this->assertTrue(factory(Post::class)->create([
            'published_at' => now()->subDay(),
        ])->published);
    }

    public function testReadTimeAttribute(): void
    {
        $post = factory(Post::class)->create();

        $minutes = ceil(str_word_count($post->body) / 250);

        $this->assertEquals(
            $post->readTime,
            sprintf('%d %s %s', $minutes, Str::plural(trans('canvas::app.min'), $minutes), trans('canvas::app.read'))
        );
    }

    public function testPopularReadingTimesAttribute(): void
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

    public function testTopReferersAttribute(): void
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

    public function testPostsCanShareTheSameSlugWithUniqueUsers(): void
    {
        $data = [
            'slug' => 'a-new-post',
            'title' => 'A new post',
        ];

        $primaryPost = factory(Post::class)->create([
            'user_id' => $this->admin->id,
        ]);
        $response = $this->actingAs($this->admin, 'canvas')->postJson("/canvas/api/posts/{$primaryPost->id}", $data);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $response->original['id'],
            'slug' => $response->original['slug'],
            'user_id' => $response->original['user_id'],
        ]);

        $secondaryPost = factory(Post::class)->create([
            'user_id' => $this->editor->id,
        ]);
        $response = $this->actingAs($this->editor, 'canvas')->postJson("/canvas/api/posts/{$secondaryPost->id}", $data);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $response->original['id'],
            'slug' => $response->original['slug'],
            'user_id' => $response->original['user_id'],
        ]);
    }

    public function testTagsRelationship(): void
    {
        $post = factory(Post::class)->create();
        $tag = factory(Tag::class)->create();

        $post->tags()->sync($tag);

        $this->assertInstanceOf(BelongsToMany::class, $post->tags());
        $this->assertInstanceOf(Tag::class, $post->tags->first());
    }

    public function testTopicRelationship(): void
    {
        $post = factory(Post::class)->create();
        $topic = factory(Topic::class)->create();

        $post->topic()->sync($topic);

        $this->assertInstanceOf(BelongsToMany::class, $post->topic());
        $this->assertInstanceOf(Topic::class, $post->topic->first());
    }

    public function testUserRelationship(): void
    {
        $post = factory(Post::class)->create();

        $this->assertInstanceOf(BelongsTo::class, $post->user());
        $this->assertInstanceOf(User::class, $post->user);
    }

    public function testViewsRelationship(): void
    {
        $post = factory(Post::class)->create();

        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $this->assertInstanceOf(HasMany::class, $post->views());
        $this->assertInstanceOf(View::class, $post->views->first());
    }

    public function testVisitsRelationship(): void
    {
        $post = factory(Post::class)->create();

        factory(Visit::class)->create([
            'post_id' => $post->id,
        ]);

        $this->assertInstanceOf(HasMany::class, $post->visits());
        $this->assertInstanceOf(Visit::class, $post->visits->first());
    }

    public function testPublishedScope(): void
    {
        factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->subDay(),
        ]);

        $this->assertInstanceOf(Builder::class, resolve(Post::class)->published());
        $this->assertCount(1, Post::published()->get());
    }

    public function testDraftScope(): void
    {
        factory(Post::class)->create([
            'user_id' => $this->admin->id,
            'published_at' => now()->addDay(),
        ]);

        $this->assertInstanceOf(Builder::class, resolve(Post::class)->draft());
        $this->assertCount(1, Post::draft()->get());
    }

    public function testDetachTaxonomyOnDelete(): void
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
