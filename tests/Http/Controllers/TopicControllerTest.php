<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Http\Middleware\Admin;
use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class TopicControllerTest.
 *
 * @covers \Canvas\Http\Controllers\TopicController
 */
class TopicControllerTest extends TestCase
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
            Admin::class,
            Session::class,
            VerifyCsrfToken::class,
        ]);

        $this->registerAssertJsonExactFragmentMacro();
    }

    /** @test */
    public function it_can_fetch_topics()
    {
        $topic = factory(Topic::class)->create();

        $this->actingAs($topic->user)
             ->getJson('canvas/api/topics')
             ->assertSuccessful()
             ->assertJsonExactFragment($topic->id, 'data.0.id')
             ->assertJsonExactFragment($topic->name, 'data.0.name')
             ->assertJsonExactFragment($topic->user->id, 'data.0.user_id')
             ->assertJsonExactFragment($topic->slug, 'data.0.slug')
             ->assertJsonExactFragment($topic->posts->count(), 'data.0.posts_count')
             ->assertJsonExactFragment(1, 'total');
    }

    /** @test */
    public function it_can_fetch_a_new_topic()
    {
        $user = factory(config('canvas.user'))->create();

        $response = $this->actingAs($user)->getJson('canvas/api/topics/create')->assertSuccessful();

        $this->assertArrayHasKey('id', $response->decodeResponseJson());
    }

    /** @test */
    public function it_can_fetch_an_existing_topic()
    {
        $topic = factory(Topic::class)->create();

        $this->actingAs($topic->user)
             ->getJson("canvas/api/topics/{$topic->id}")
             ->assertSuccessful()
             ->assertJsonExactFragment($topic->id, 'id')
             ->assertJsonExactFragment($topic->name, 'name')
             ->assertJsonExactFragment($topic->user->id, 'user_id')
             ->assertJsonExactFragment($topic->slug, 'slug');
    }

    /** @test */
    public function it_can_fetch_posts_for_an_existing_topic()
    {
        $topic = factory(Topic::class)->create();
        $post = factory(Post::class)->create();
        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $topic->posts()->sync([$post->id]);

        $response = $this->actingAs($topic->user)
                         ->getJson("canvas/api/topics/{$topic->id}/posts")
                         ->assertSuccessful();

        $this->assertIsArray($response->decodeResponseJson('data'));
        $this->assertCount(1, $response->decodeResponseJson('data'));
        $this->assertArrayHasKey('views_count', $response->decodeResponseJson('data.0'));
        $this->assertEquals(1, $response->decodeResponseJson('data.0.views_count'));
    }

    /** @test */
    public function it_returns_404_if_no_topic_is_found()
    {
        $user = factory(config('canvas.user'))->create();

        $this->actingAs($user)->getJson('canvas/api/topics/not-a-topic')->assertNotFound();
    }

    /** @test */
    public function it_can_create_a_new_topic()
    {
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
    }

    /** @test */
    public function it_can_update_an_existing_topic()
    {
        $topic = factory(Topic::class)->create();

        $data = [
            'name' => 'An updated topic',
            'slug' => 'an-updated-topic',
        ];

        $this->actingAs($topic->user)
             ->postJson("canvas/api/topics/{$topic->id}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['name'], 'name')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($topic->user->id, 'user_id');
    }

    /** @test */
    public function it_will_not_store_an_invalid_slug()
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
    public function it_can_delete_a_topic()
    {
        $topic = factory(Topic::class)->create([
            'name' => 'A new topic',
            'slug' => 'a-new-topic',
        ]);

        $this->actingAs($topic->user)
             ->deleteJson('canvas/api/topics/not-a-topic')
             ->assertNotFound();

        $this->actingAs($topic->user)
             ->deleteJson("canvas/api/topics/{$topic->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_topics', [
            'id' => $topic->id,
            'slug' => $topic->slug,
        ]);
    }

    /** @test */
    public function it_can_de_sync_the_post_relationship()
    {
        $topic = factory(Topic::class)->create();

        $post = factory(Post::class)->create([
            'user_id' => $topic->user->id,
            'slug' => 'a-new-post',
        ]);

        $topic->posts()->sync([$post->id]);

        $this->assertDatabaseHas('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $topic->id,
        ]);

        $this->assertCount(1, $topic->posts);

        $this->actingAs($topic->user)->deleteJson("canvas/api/posts/{$post->id}")->assertSuccessful()->assertNoContent();

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
