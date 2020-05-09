<?php

namespace Canvas\Tests;

use Canvas\Http\Middleware\Session;
use Canvas\Post;
use Canvas\Topic;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

class TopicTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([Authorize::class, Session::class, VerifyCsrfToken::class]);
    }

    /** @test */
    public function topics_can_share_the_same_slug_with_unique_users()
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A new topic',
            'slug' => 'a-new-topic',
        ];

        $topic_1 = factory(Topic::class)->create();
        $response = $this->actingAs($topic_1->user)->postJson("/canvas/api/topics/{$topic_1->id}", $data);

        $this->assertDatabaseHas('canvas_topics', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);

        $topic_2 = factory(Topic::class)->create();
        $response = $this->actingAs($topic_2->user)->postJson("/canvas/api/topics/{$topic_2->id}", $data);

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

        $this->assertCount(1, $topic->posts);
        $this->assertInstanceOf(Post::class, $topic->posts->first());
    }

    /** @test */
    public function user_relationship()
    {
        $topic = factory(Topic::class)->create();

        $this->assertInstanceOf(config('canvas.user'), $topic->user);
    }

    /** @test */
    public function for_user_scope()
    {
        $user = factory(config('canvas.user'))->create();

        $topic = factory(Topic::class)->create([
            'user_id' => $user->id,
        ]);

        $this->assertEquals(1, $topic->forUser($user)->count());
    }
}
