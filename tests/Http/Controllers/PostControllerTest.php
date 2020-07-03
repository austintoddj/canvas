<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

class PostControllerTest extends TestCase
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
    public function posts_can_be_listed()
    {
        // Post list defaults to published...
        $published = factory(Post::class)->create();

        $this->actingAs($published->user)
             ->getJson('canvas/api/posts')
             ->assertSuccessful()
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment(0, 'draftCount')
             ->assertJsonExactFragment(1, 'publishedCount')
             ->assertJsonExactFragment(0, 'views_count');

        // Request query type set to draft...
        $draft = factory(Post::class)->create([
            'published_at' => now()->addMonth(),
        ]);
        $this->actingAs($draft->user)
             ->getJson('canvas/api/posts?type=draft')
             ->assertSuccessful()
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment(1, 'draftCount')
             ->assertJsonExactFragment(0, 'publishedCount')
             ->assertJsonExactFragment(0, 'views_count');
    }

    /** @test */
    public function posts_can_be_fetched()
    {
        // Fetch post defaults...
        $user = factory(config('canvas.user'))->create();
        $response = $this->actingAs($user)->getJson('canvas/api/posts/create')->assertSuccessful();

        $this->assertArrayHasKey('id', $response->decodeResponseJson('post'));
        $this->assertArrayHasKey('slug', $response->decodeResponseJson('post'));
        $this->assertArrayHasKey('read_time', $response->decodeResponseJson('post'));
        $this->assertArrayHasKey('tags', $response->decodeResponseJson());
        $this->assertArrayHasKey('topics', $response->decodeResponseJson());

        // Fetch an existing post...
        $post = factory(Post::class)->create();
        $this->actingAs($post->user)
             ->getJson("canvas/api/posts/{$post->id}")
             ->assertSuccessful()
             ->assertJsonExactFragment($post->id, 'post.id')
             ->assertJsonExactFragment($post->title, 'post.title')
             ->assertJsonExactFragment($post->user_id, 'post.user_id')
             ->assertJsonExactFragment($post->slug, 'post.slug');
    }

    /** @test */
    public function it_returns_404_if_no_post_is_found()
    {
        $user = factory(config('canvas.user'))->create();

        $this->actingAs($user)->getJson('canvas/api/posts/not-a-post')->assertNotFound();
    }

    /** @test */
    public function only_post_owners_can_access_posts()
    {
        $userOne = factory(config('canvas.user'))->create();
        $userTwo = factory(config('canvas.user'))->create();

        $post = factory(Post::class)->create([
            'user_id' => $userOne->id,
        ]);

        $this->actingAs($userOne)->getJson("canvas/api/posts/{$post->id}")->assertSuccessful();
        $this->actingAs($userTwo)->getJson("canvas/api/posts/{$post->id}")->assertNotFound();
    }

    /** @test */
    public function posts_can_be_stored()
    {
        // Create a new post...
        $user = factory(config('canvas.user'))->create();

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'a-new-post',
        ];

        $response = $this->actingAs($user)
                         ->postJson("canvas/api/posts/{$data['id']}", $data)
                         ->assertSuccessful()
                         ->assertJsonExactFragment($data['id'], 'id')
                         ->assertJsonExactFragment($data['slug'], 'slug')
                         ->assertJsonExactFragment($user->id, 'user_id');

        $this->assertArrayHasKey('id', $response);
        $this->assertArrayHasKey('slug', $response);
        $this->assertArrayHasKey('title', $response);
        $this->assertArrayHasKey('user_id', $response);

        // Update an existing post...
        $post = factory(Post::class)->create([
            'title' => 'Original Title',
            'slug' => 'original-slug',
        ]);

        $data = [
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ];

        $response = $this->actingAs($post->user)->postJson("canvas/api/posts/{$post->id}", $data)->assertSuccessful();

        $this->assertSame($data['title'], $response->decodeResponseJson('title'));
        $this->assertSame($data['slug'], $response->decodeResponseJson('slug'));

        $this->assertArrayHasKey('published_at', $response);
    }

    /** @test */
    public function sync_related_taxonomy()
    {
        $user = factory(config('canvas.user'))->create();

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'a-new-post',
            'tags' => [
                [
                    'name' => 'A new tag',
                    'slug' => 'a-new-tag',
                ],
                [
                    'name' => 'Another tag',
                    'slug' => 'another-tag',
                ],
            ],
            'topic' => [
                'name' => 'A new topic',
                'slug' => 'a-new-topic',
            ],
        ];

        $this->actingAs($user)
             ->postJson("canvas/api/posts/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['id'], 'id')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($user->id, 'user_id');

        $post = Post::find($data['id']);

        $this->assertCount(2, $post->tags);
        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
        ]);

        $this->assertCount(1, $post->topic);
        $this->assertDatabaseHas('canvas_posts_topics', [
            'post_id' => $post->id,
        ]);
    }

    /** @test */
    public function invalid_slugs_will_not_be_stored()
    {
        $post = factory(Post::class)->create();

        $response = $this->actingAs($post->user)->postJson("canvas/api/posts/{$post->id}", [
            'slug' => 'a new.slug',
        ])->assertStatus(422);

        $this->assertArrayHasKey('slug', $response->decodeResponseJson('errors'));
    }

    /** @test */
    public function posts_can_be_deleted()
    {
        $userOne = factory(config('canvas.user'))->create();
        $userTwo = factory(config('canvas.user'))->create();

        $post = factory(Post::class)->create([
            'user_id' => $userOne->id,
            'slug' => 'a-new-post',
        ]);

        $this->actingAs($userTwo)->deleteJson("canvas/api/posts/{$post->id}")->assertNotFound();

        $this->actingAs($userOne)->deleteJson('canvas/api/posts/not-a-post')->assertNotFound();

        $this->actingAs($userOne)->deleteJson("canvas/api/posts/{$post->id}")->assertSuccessful()->assertNoContent();

        $this->assertSoftDeleted('canvas_posts', [
            'id' => $post->id,
            'slug' => $post->slug,
        ]);
    }

    /** @test */
    public function de_sync_related_taxonomy()
    {
        $user = factory(config('canvas.user'))->create();

        $post = factory(Post::class)->create([
            'user_id' => $user->id,
            'slug' => 'a-new-post',
        ]);

        $tag = factory(Tag::class)->create();
        $post->tags()->sync([$tag->id]);

        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);

        $this->assertCount(1, $post->tags);

        $topic = factory(Topic::class)->create();
        $post->topic()->sync([$topic->id]);
        $this->assertCount(1, $post->topic);

        $this->assertDatabaseHas('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $topic->id,
        ]);

        $this->actingAs($user)->deleteJson("canvas/api/posts/{$post->id}")->assertSuccessful()->assertNoContent();

        $this->assertSoftDeleted('canvas_posts', [
            'id' => $post->id,
            'slug' => $post->slug,
        ]);

        $this->assertDatabaseMissing('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);

        $this->assertDatabaseMissing('canvas_posts_topics', [
            'post_id' => $post->id,
            'topic_id' => $tag->id,
        ]);

        $this->assertCount(0, $post->refresh()->tags);
        $this->assertCount(0, $post->refresh()->topic);
    }
}
