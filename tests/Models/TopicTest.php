<?php

namespace Canvas\Tests\Models;

use Canvas\Models\Post;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class TopicTest.
 *
 * @covers \Canvas\Models\Topic
 */
class TopicTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function topics_can_share_the_same_slug_with_unique_users()
    {
        $adminUserOne = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A new topic',
            'slug' => 'a-new-topic',
        ];

        $topicOne = factory(Topic::class)->create();

        $response = $this->actingAs($adminUserOne, 'canvas')->postJson("/canvas/api/topics/{$topicOne->id}", $data);

        $this->assertDatabaseHas('canvas_topics', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);

        $adminUserTwo = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $topicTwo = factory(Topic::class)->create();

        $response = $this->actingAs($adminUserTwo, 'canvas')->postJson("/canvas/api/topics/{$topicTwo->id}", $data);

        $this->assertDatabaseHas('canvas_topics', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);
    }

    /** @test */
    public function posts_relationship()
    {
        $topic = factory(Topic::class)->create();
        $post = factory(Post::class)->create();

        $post->topic()->sync($topic);

        $this->assertCount(1, $post->topic);
        $this->assertInstanceOf(BelongsToMany::class, $topic->posts());
        $this->assertInstanceOf(Post::class, $topic->posts->first());
    }

    /** @test */
    public function user_relationship()
    {
        $topic = factory(Topic::class)->create();

        $this->assertInstanceOf(BelongsTo::class, $topic->user());
        $this->assertInstanceOf(User::class, $topic->user);
    }

    /** @test */
    public function it_will_detach_posts_on_delete()
    {
        $topic = factory(Topic::class)->create();
        $post = factory(Post::class)->create();

        $topic->posts()->sync([$post->id]);

        $topic->delete();

        $this->assertEquals(0, $topic->posts->count());
        $this->assertDatabaseMissing('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $topic->id,
        ]);
    }
}
