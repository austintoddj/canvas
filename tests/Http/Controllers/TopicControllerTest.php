<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Topic;
use Canvas\Models\User;
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
        $topic = Topic::factory(2)->create();

        $response = $this->actingAs($topic->first()->user, 'canvas')
                         ->getJson('canvas/api/topics')
                         ->assertSuccessful();

        $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

        $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

        $this->assertCount(2, $response->getOriginalContent());
    }

    public function testTopicsCanBeSortedByCreationDateWithAGivenQueryParameter(): void
    {
        $topic = Topic::factory()->create(['created_at' => now()]);

        $oldTopic = Topic::factory()->create(['created_at' => now()->subDay()]);

        $response = $this->actingAs($topic->user, 'canvas')
            ->getJson(route('canvas.topics.index', ['sort' => 'desc']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $topic->id);

        $response = $this->actingAs($topic->user, 'canvas')
            ->getJson(route('canvas.topics.index', ['sort' => 'asc']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $oldTopic->id);

        $response = $this->actingAs($topic->user, 'canvas')
            ->getJson(route('canvas.topics.index'))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $topic->id);
    }

    public function testTopicsCanBeFilteredByUsageWithAGivenQueryParameter(): void
    {
        $popularTopic = Topic::factory()->has(Post::factory(2))->create();

        $unpopularTopic = Topic::factory()->has(Post::factory())->create();

        $response = $this->actingAs($popularTopic->user, 'canvas')
            ->getJson(route('canvas.topics.index', ['usage' => 'popular']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $popularTopic->id);

        $response = $this->actingAs($popularTopic->user, 'canvas')
            ->getJson(route('canvas.topics.index', ['usage' => 'unpopular']))
            ->assertSuccessful();

        $this->assertSame($response->getOriginalContent()->first()->id, $unpopularTopic->id);
    }

    public function testCreateDataForTopic(): void
    {
        $response = $this->actingAs(User::factory()->admin()->create(), 'canvas')
                         ->getJson('canvas/api/topics/create')
                         ->assertSuccessful();

        $this->assertInstanceOf(Topic::class, $response->getOriginalContent());
    }

    public function testExistingTopicData(): void
    {
        $topic = Topic::factory()->create();

        $response = $this->actingAs($topic->user, 'canvas')
                         ->getJson("canvas/api/topics/{$topic->id}")
                         ->assertSuccessful();

        $this->assertTrue($topic->is($response->getOriginalContent()));
    }

    public function testListPostsForTopic(): void
    {
        $topic = Topic::factory()->has(Post::factory())->create();

        $response = $this->actingAs($topic->user, 'canvas')
                         ->getJson("canvas/api/topics/{$topic->id}/posts")
                         ->assertSuccessful();

        $this->assertInstanceOf(Post::class, $response->getOriginalContent()->first());

        $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

        $this->assertCount(1, $response->getOriginalContent());
    }

    public function testTopicNotFound(): void
    {
        $this->actingAs(User::factory()->admin()->create(), 'canvas')
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

        $response = $this->actingAs(User::factory()->admin()->create(), 'canvas')
                         ->postJson("canvas/api/topics/{$data['id']}", $data)
                         ->assertSuccessful();

        $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

        $this->assertSame($data['id'], $response->getOriginalContent()->id);
    }

    public function testDeletedTopicsCanBeRefreshed(): void
    {
        $deletedTopic = Topic::factory()->create(['deleted_at' => now()]);

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => $deletedTopic->name,
            'slug' => $deletedTopic->slug,
        ];

        $response = $this->actingAs($deletedTopic->user, 'canvas')
                         ->postJson("canvas/api/topics/{$data['id']}", $data)
                         ->assertSuccessful();

        $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

        $this->assertSame($deletedTopic['id'], $response->getOriginalContent()->id);
    }

    public function testUpdateExistingTopic(): void
    {
        $topic = Topic::factory()->create();

        $data = [
            'name' => 'An updated topic',
            'slug' => 'an-updated-topic',
        ];

        $response = $this->actingAs($topic->user, 'canvas')
                         ->postJson("canvas/api/topics/{$topic->id}", $data)
                         ->assertSuccessful();

        $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

        $this->assertSame($data['slug'], $response->getOriginalContent()->slug);
    }

    public function testInvalidSlugsAreValidated(): void
    {
        $topic = Topic::factory()->create();

        $this->actingAs($topic->user, 'canvas')
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
        $topic = Topic::factory()->create();

        $this->actingAs($topic->user, 'canvas')
             ->deleteJson('canvas/api/topics/not-a-topic')
             ->assertNotFound();

        $this->actingAs($topic->user, 'canvas')
             ->deleteJson("canvas/api/topics/{$topic->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_topics', [
            'id' => $topic->id,
            'slug' => $topic->slug,
        ]);
    }
}
