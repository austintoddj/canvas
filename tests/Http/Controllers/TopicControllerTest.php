<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Pagination\LengthAwarePaginator;
use Ramsey\Uuid\Uuid;

/**
 * Class TopicControllerTest.
 *
 * @covers \Canvas\Http\Controllers\TopicController
 * @covers \Canvas\Http\Requests\StoreTopicRequest
 */
class TopicControllerTest extends TestCase
{
    use RefreshDatabase;

    public function testListAllTopics(): void
    {
        factory(Topic::class, 2)->create();

        $response = $this->actingAs($this->admin, 'canvas')
                         ->getJson('canvas/api/topics')
                         ->assertSuccessful();

        $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

        $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

        $this->assertCount(2, $response->getOriginalContent());
    }

    public function testTopicsCanBeSortedByCreationDateWithAGivenQueryParameter(): void
    {
        $newTopic = factory(Topic::class)->create([
            'created_at' => now()->subHour(),
        ]);

        $oldTopic = factory(Topic::class)->create([
            'created_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->admin, 'canvas')
            ->getJson(route('canvas.topics.index', ['sort' => 'desc']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $newTopic->id);

        $response = $this->actingAs($this->admin, 'canvas')
            ->getJson(route('canvas.topics.index', ['sort' => 'asc']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $oldTopic->id);

        $response = $this->actingAs($this->admin, 'canvas')
            ->getJson(route('canvas.topics.index'))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $newTopic->id);
    }

    public function testTopicsCanBeFilteredByUsageWithAGivenQueryParameter(): void
    {
        $posts = factory(Post::class, 10)->create();

        $lessPopularTopic = factory(Topic::class)->create([
            'created_at' => now()->subHour(),
        ]);

        $popularTopic = factory(Topic::class)->create([
            'created_at' => now()->subDay(),
        ]);

        $unpopularTopic = factory(Topic::class)->create([
            'created_at' => now()->subMonth(),
        ]);

        $popularTopic->posts()->sync($posts->take(10)->pluck('id'));
        $lessPopularTopic->posts()->sync($posts->take(5)->pluck('id'));
        $unpopularTopic->posts()->sync($posts->take(0)->pluck('id'));

        $response = $this->actingAs($this->admin, 'canvas')
            ->getJson(route('canvas.topics.index', ['usage' => 'popular']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $popularTopic->id);

        $response = $this->actingAs($this->admin, 'canvas')
            ->getJson(route('canvas.topics.index', ['usage' => 'unpopular']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $unpopularTopic->id);

        $response = $this->actingAs($this->admin, 'canvas')
            ->getJson(route('canvas.topics.index'))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $lessPopularTopic->id);
    }

    public function testCreateDataForTopic(): void
    {
        $response = $this->actingAs($this->admin, 'canvas')
                         ->getJson('canvas/api/topics/create')
                         ->assertSuccessful();

        $this->assertInstanceOf(Topic::class, $response->getOriginalContent());
    }

    public function testExistingTopicData(): void
    {
        $topic = factory(Topic::class)->create();

        $response = $this->actingAs($this->admin, 'canvas')
                         ->getJson("canvas/api/topics/{$topic->id}")
                         ->assertSuccessful();

        $this->assertTrue($topic->is($response->getOriginalContent()));
    }

    public function testListPostsForTopic(): void
    {
        $topic = factory(Topic::class)->create();
        $post = factory(Post::class)->create();

        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $topic->posts()->sync([$post->id]);

        $response = $this->actingAs($this->admin, 'canvas')
                         ->getJson("canvas/api/topics/{$topic->id}/posts")
                         ->assertSuccessful();

        $this->assertInstanceOf(Post::class, $response->getOriginalContent()->first());

        $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

        $this->assertCount(1, $response->getOriginalContent());
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

        $response = $this->actingAs($this->admin, 'canvas')
                         ->postJson("canvas/api/topics/{$data['id']}", $data)
                         ->assertSuccessful();

        $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

        $this->assertSame($data['id'], $response->getOriginalContent()->id);
    }

    public function testDeletedTopicsCanBeRefreshed(): void
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

        $response = $this->actingAs($this->admin, 'canvas')
                         ->postJson("canvas/api/topics/{$data['id']}", $data)
                         ->assertSuccessful();

        $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

        $this->assertSame($deletedTopic['id'], $response->getOriginalContent()->id);
    }

    public function testUpdateExistingTopic(): void
    {
        $topic = factory(Topic::class)->create();

        $data = [
            'name' => 'An updated topic',
            'slug' => 'an-updated-topic',
        ];

        $response = $this->actingAs($this->admin, 'canvas')
                         ->postJson("canvas/api/topics/{$topic->id}", $data)
                         ->assertSuccessful();

        $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

        $this->assertSame($data['slug'], $response->getOriginalContent()->slug);
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
