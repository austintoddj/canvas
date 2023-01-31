<?php

namespace Canvas\Tests\Models;

use Canvas\Models\Post;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Class TopicTest.
 *
 * @covers \Canvas\Models\Topic
 */
class TopicTest extends TestCase
{
    use RefreshDatabase;

    public function testMetaIsCastToArray(): void
    {
        $this->assertIsArray(Topic::factory()->create()->meta);
    }

    public function testTopicsCanShareTheSameSlugWithUniqueUsers(): void
    {
        $primaryAdmin = User::factory()->admin()->create();

        $response = $this->actingAs($primaryAdmin, 'canvas')
            ->postJson(route('canvas.topics.store'), [
                'name' => 'A new topic',
                'slug' => 'a-new-topic',
                'user_id' => $primaryAdmin->id,
            ]);

        $this->assertDatabaseHas('canvas_topics', [
            'id' => $response->original['id'],
            'slug' => $response->original['slug'],
            'user_id' => $response->original['user_id'],
        ]);

        $secondaryAdmin = User::factory()->admin()->create();

        $response = $this->actingAs($secondaryAdmin, 'canvas')
            ->postJson(route('canvas.topics.store'), [
                'name' => 'A new topic',
                'slug' => 'a-new-topic',
                'user_id' => $secondaryAdmin->id,
            ]);

        $this->assertDatabaseHas('canvas_topics', [
            'id' => $response->original['id'],
            'slug' => $response->original['slug'],
            'user_id' => $response->original['user_id'],
        ]);
    }

    public function testPostsRelationship(): void
    {
        $topic = Topic::factory()->has(Post::factory())->create();

        $this->assertInstanceOf(HasMany::class, $topic->posts());
        $this->assertInstanceOf(Post::class, $topic->posts->first());
    }

    public function testUserRelationship(): void
    {
        $topic = Topic::factory()->has(User::factory())->create();

        $this->assertInstanceOf(BelongsTo::class, $topic->user());
        $this->assertInstanceOf(User::class, $topic->user);
    }

    public function testDissociatePostsOnDelete(): void
    {
        $topic = Topic::factory()->has(Post::factory())->create();

        $post = $topic->posts()->first();

        $topic->delete();

        $this->assertNull($post->topic);
    }
}
