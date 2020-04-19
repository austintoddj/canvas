<?php

namespace Canvas\Tests\Controllers;

use Canvas\Http\Middleware\Session;
use Canvas\Tests\TestCase;
use Canvas\Topic;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

class TopicControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([Authorize::class, Session::class, VerifyCsrfToken::class]);

        $this->registerAssertJsonExactFragmentMacro();
    }

    /** @test */
    public function topics_can_be_listed()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $user_2 = factory(config('canvas.user'))->create();

        $topic = factory(Topic::class)->create([
            'user_id' => $user_1->id,
            'name' => 'A new topic',
            'slug' => 'a-new-topic',
        ]);

        $this->actingAs($user_1)
             ->getJson('canvas/api/topics')
             ->assertSuccessful()
             ->assertJsonExactFragment($topic->id, 'data.0.id')
             ->assertJsonExactFragment($topic->name, 'data.0.name')
             ->assertJsonExactFragment($user_1->id, 'data.0.user_id')
             ->assertJsonExactFragment($topic->slug, 'data.0.slug')
             ->assertJsonExactFragment($topic->posts->count(), 'data.0.posts_count')
             ->assertJsonExactFragment(1, 'total');

        $this->actingAs($user_2)
             ->getJson('canvas/api/topics')
             ->assertSuccessful()
             ->assertJsonExactFragment(0, 'total');
    }

    /** @test */
    public function topics_can_be_fetched()
    {
        // Fetch topic defaults...
        $user = factory(config('canvas.user'))->create();

        $response = $this->actingAs($user)->getJson('canvas/api/topics/create')->assertSuccessful();

        $this->assertArrayHasKey('id', $response->decodeResponseJson());

        // Fetch an existing topic...
        $user = factory(config('canvas.user'))->create();

        $topic = factory(Topic::class)->create([
            'user_id' => $user->id,
            'name' => 'A new topic',
            'slug' => 'a-new-topic',
        ]);

        $this->actingAs($user)
             ->getJson("canvas/api/topics/{$topic->id}")
             ->assertSuccessful()
             ->assertJsonExactFragment($topic->id, 'id')
             ->assertJsonExactFragment($topic->name, 'name')
             ->assertJsonExactFragment($user->id, 'user_id')
             ->assertJsonExactFragment($topic->slug, 'slug');

        // Topic not found...
        $this->actingAs($user)->getJson('canvas/api/topics/not-a-topic')->assertNotFound();
    }

    /** @test */
    public function only_topic_owners_can_access_topics()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $user_2 = factory(config('canvas.user'))->create();

        $topic = factory(Topic::class)->create([
            'user_id' => $user_1->id,
            'name' => 'A topic for user 1',
            'slug' => 'a-topic-for-user-1',
        ]);

        $this->actingAs($user_2)->getJson("canvas/api/topics/{$topic->id}")->assertNotFound();
    }

    /** @test */
    public function topics_can_be_stored()
    {
        // Create a new topic...
        $user = factory(config('canvas.user'))->create();

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A new topic',
            'slug' => 'a-new-topic',
        ];

        $this->actingAs($user)
             ->postJson("canvas/api/topics/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['name'], 'name')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($user->id, 'user_id');

        // Update an existing topic...
        $topic = factory(Topic::class)->create();

        $data = [
            'name' => 'A new topic',
            'slug' => 'a-new-topic',
        ];

        $this->actingAs($topic->user)
             ->postJson("canvas/api/topics/{$topic->id}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['name'], 'name')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($topic->user->id, 'user_id');
    }

    /** @test */
    public function invalid_slugs_will_not_be_stored()
    {
        $topic = factory(Topic::class)->create();

        $response = $this->actingAs($topic->user)
                         ->postJson("canvas/api/topics/{$topic->id}", [
                             'name' => 'A new topic',
                             'slug' => 'a new.slug',
                         ])
                         ->assertStatus(422);

        $this->assertArrayHasKey('slug', $response->decodeResponseJson('errors'));
    }

    /** @test */
    public function topics_can_be_deleted()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $user_2 = factory(config('canvas.user'))->create();

        $topic = factory(Topic::class)->create([
            'user_id' => $user_1->id,
            'name' => 'A new topic',
            'slug' => 'a-new-topic',
        ]);

        $this->actingAs($user_2)
             ->deleteJson("canvas/api/topics/{$topic->id}")
             ->assertNotFound();

        $this->actingAs($user_1)
             ->deleteJson('canvas/api/topics/not-a-topic')
             ->assertNotFound();

        $this->actingAs($user_1)
             ->deleteJson("canvas/api/topics/{$topic->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_topics', [
            'id' => $topic->id,
            'slug' => $topic->slug,
        ]);
    }
}
