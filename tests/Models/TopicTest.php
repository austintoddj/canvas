<?php

namespace Canvas\Tests\Models;

use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Models\Topic;
use Canvas\Models\UserMeta;
use Canvas\Tests\TestCase;
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

        $this->withoutMiddleware([
            Authorize::class,
            Session::class,
            VerifyCsrfToken::class,
        ]);
    }

    /** @test */
    public function topics_can_share_the_same_slug_with_unique_users()
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A new topic',
            'slug' => 'a-new-topic',
        ];

        $topicOne = factory(Topic::class)->create();

        factory(UserMeta::class)->create([
            'user_id' => $topicOne->user->id,
            'admin' => 1,
        ]);

        $response = $this->actingAs($topicOne->user)->postJson("/canvas/api/topics/{$topicOne->id}", $data);

        $this->assertDatabaseHas('canvas_topics', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);

        $topicTwo = factory(Topic::class)->create();

        factory(UserMeta::class)->create([
            'user_id' => $topicTwo->user->id,
            'admin' => 1,
        ]);

        $response = $this->actingAs($topicTwo->user)->postJson("/canvas/api/topics/{$topicTwo->id}", $data);

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
    public function userMeta_relationship()
    {
        $topic = factory(Topic::class)->create();

        factory(UserMeta::class)->create([
            'user_id' => $topic->user->id,
        ]);

        $this->assertInstanceOf(UserMeta::class, $topic->userMeta);
    }

    /** @test */
    public function it_will_detach_posts_on_delete()
    {
        $tag = factory(Topic::class)->create();
        $post = factory(Post::class)->create();

        $tag->posts()->sync([$post->id]);

        $tag->delete();

        $this->assertEquals(0, $tag->posts->count());
        $this->assertDatabaseMissing('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $tag->id,
        ]);
    }
}
