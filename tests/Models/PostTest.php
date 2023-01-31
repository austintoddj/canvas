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
        $this->assertInstanceOf(Carbon::class, Post::factory()->published()->create()->published_at);
    }

    public function testMetaIsCastToArray(): void
    {
        $this->assertIsArray(Post::factory()->create()->meta);
    }

    public function testEstimatedReadTimeInMinutesIsAppendedToModel(): void
    {
        $this->assertArrayHasKey('estimated_read_time_in_minutes', Post::factory()->create()->toArray());
    }

    public function testPostsCanShareTheSameSlugWithUniqueUsers(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->postJson(route('canvas.posts.store'), [
                'slug' => 'a-new-post',
                'title' => 'A new post',
                'user_id' => $admin->id,
            ]);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $response->original['id'],
            'slug' => $response->original['slug'],
            'user_id' => $response->original['user_id'],
        ]);

        $editor = User::factory()->editor()->create();

        $response = $this->actingAs($editor, 'canvas')
            ->postJson(route('canvas.posts.store'), [
                'slug' => 'a-new-post',
                'title' => 'A new post',
                'user_id' => $editor->id,
            ]);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $response->original['id'],
            'slug' => $response->original['slug'],
            'user_id' => $response->original['user_id'],
        ]);
    }

    public function testTagsRelationship(): void
    {
        $post = Post::factory()->has(Tag::factory())->create();

        $this->assertInstanceOf(BelongsToMany::class, $post->tags());
        $this->assertInstanceOf(Tag::class, $post->tags->first());
    }

    public function testTopicRelationship(): void
    {
        $post = Post::factory()->for(Topic::factory())->create();

        $this->assertInstanceOf(BelongsTo::class, $post->topic());
        $this->assertInstanceOf(Topic::class, $post->topic->first());
    }

    public function testUserRelationship(): void
    {
        $post = Post::factory()->create();

        $this->assertInstanceOf(BelongsTo::class, $post->user());
        $this->assertInstanceOf(User::class, $post->user);
    }

    public function testViewsRelationship(): void
    {
        $post = Post::factory()->has(View::factory())->create();

        $this->assertInstanceOf(HasMany::class, $post->views());
        $this->assertInstanceOf(View::class, $post->views->first());
    }

    public function testVisitsRelationship(): void
    {
        $post = Post::factory()->has(Visit::factory())->create();

        $this->assertInstanceOf(HasMany::class, $post->visits());
        $this->assertInstanceOf(Visit::class, $post->visits->first());
    }

    public function testEstimatedReadTimeInMinutesAttribute(): void
    {
        $post = Post::factory()->create([
            'body' => fake()->words(249, true),
        ]);

        $this->assertSame(1, $post->estimatedReadTimeInMinutes);

        $post = Post::factory()->create([
            'body' => fake()->words(251, true),
        ]);

        $this->assertSame(2, $post->estimatedReadTimeInMinutes);
    }

    public function testPublishedAttribute(): void
    {
        $this->assertTrue((Post::factory()->published()->create())->published);
    }

    public function testDraftAttribute(): void
    {
        $this->assertTrue((Post::factory()->draft()->create())->draft);
    }

    public function testPublishedScope(): void
    {
        Post::factory()->published()->create();

        $this->assertInstanceOf(Builder::class, resolve(Post::class)->published());
        $this->assertCount(1, Post::published()->get());
    }

    public function testDraftScope(): void
    {
        Post::factory()->draft()->create();

        $this->assertInstanceOf(Builder::class, resolve(Post::class)->draft());
        $this->assertCount(1, Post::draft()->get());
    }

    public function testDetachTagsOnDelete(): void
    {
        $post = Post::factory()->has(Tag::factory())->create();

        $tag = $post->tags()->first();

        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);

        $post->delete();

        $this->assertEquals(0, $post->tags->count());
        $this->assertDatabaseMissing('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);
    }
}
