<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Topic;
use App\Models\User;
use Canvas\Models\View;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class TopicControllerTest.
 *
 * @covers \Canvas\Http\Controllers\TopicController
 * @covers \Canvas\Http\Requests\TopicRequest
 */
class TopicControllerTest extends TestCase
{
    use RefreshDatabase;

    public function testAnAdminCanFetchAllTopics(): void
    {
        $topic = factory(Topic::class)->create([
            'user_id' => factory(User::class)->create([
                'role' => User::ADMIN,
            ]),
        ]);

        factory(Topic::class, 4)->create();

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/topics')
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $topic->id,
                 'name' => $topic->name,
                 'user_id' => $topic->user->id,
                 'slug' => $topic->slug,
                 'posts_count' => (string) $topic->posts->count(),
                 'total' => 5,
             ]);
    }

    public function testNewPostData(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/topics/create')
             ->assertSuccessful()
             ->assertJsonStructure([
                 'id',
             ]);
    }

    public function testExistingPostData(): void
    {
        $topic = factory(Topic::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->getJson("canvas/api/topics/{$topic->id}")
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $topic->id,
                 'name' => $topic->name,
                 'user_id' => $topic->user->id,
                 'slug' => $topic->slug,
             ]);
    }

    public function testPostsCanBeFetchedForATopic(): void
    {
        $topic = factory(Topic::class)->create();
        $post = factory(Post::class)->create();

        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $topic->posts()->sync([$post->id]);

        $this->actingAs($this->admin, 'canvas')
             ->getJson("canvas/api/topics/{$topic->id}/posts")
             ->assertSuccessful()
             ->assertJsonFragment([
                 'topic_id' => $topic->id,
                 'post_id' => $post->id,
                 'views_count' => (string) $post->views->count(),
             ]);
    }

    public function testTopicNotFound(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/topics/not-a-topic')
             ->assertNotFound();
    }

    public function testStoreNewTopic(): void
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A new topic',
            'slug' => 'a-new-topic',
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/topics/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $data['id'],
                 'name' => $data['name'],
                 'slug' => $data['slug'],
                 'user_id' => $this->admin->id,
             ]);
    }

    public function testADeletedTopicCanBeRefreshed(): void
    {
        $deletedTopic = factory(Topic::class)->create([
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A deleted topic',
            'slug' => 'a-deleted-topic',
            'user_id' => $this->editor->id,
            'deleted_at' => now(),
        ]);

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => $deletedTopic->name,
            'slug' => $deletedTopic->slug,
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/topics/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $deletedTopic->id,
                 'name' => $deletedTopic->name,
                 'slug' => $deletedTopic->slug,
                 'user_id' => $deletedTopic->user_id,
             ]);
    }

    public function testUpdateExistingTopic(): void
    {
        $topic = factory(Topic::class)->create();

        $data = [
            'name' => 'An updated topic',
            'slug' => 'an-updated-topic',
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/topics/{$topic->id}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $topic->id,
                 'name' => $data['name'],
                 'slug' => $data['slug'],
                 'user_id' => $topic->user->id,
             ]);
    }

    public function testInvalidSlugsAreValidated(): void
    {
        $topic = factory(Topic::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/topics/{$topic->id}", [
                 'name' => 'A new topic',
                 'slug' => 'a new.slug',
             ])
             ->assertStatus(422)
             ->assertJsonStructure([
                 'errors' => [
                     'slug',
                 ],
             ]);
    }

    public function testDeleteExistingTopic(): void
    {
        $topic = factory(Topic::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->deleteJson('canvas/api/topics/not-a-topic')
             ->assertNotFound();

        $this->actingAs($this->admin, 'canvas')
             ->deleteJson("canvas/api/topics/{$topic->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_topics', [
            'id' => $topic->id,
            'slug' => $topic->slug,
        ]);
    }

    public function testDeSyncPostRelationship(): void
    {
        $topic = factory(Topic::class)->create();
        $post = factory(Post::class)->create();

        $topic->posts()->sync([$post->id]);

        $this->assertDatabaseHas('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $topic->id,
        ]);

        $this->assertCount(1, $topic->posts);

        $this->actingAs($this->admin, 'canvas')
             ->deleteJson("canvas/api/posts/{$post->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_posts', [
            'id' => $post->id,
            'slug' => $post->slug,
        ]);

        $this->assertDatabaseMissing('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $topic->id,
        ]);

        $this->assertCount(0, $topic->refresh()->posts);
    }
}
