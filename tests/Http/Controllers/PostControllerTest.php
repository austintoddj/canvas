<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class PostControllerTest.
 *
 * @covers \Canvas\Http\Controllers\PostController
 * @covers \Canvas\Http\Requests\StorePostRequest
 */
class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->registerAssertJsonExactFragmentMacro();
    }

    /** @test */
    public function it_fetches_published_posts_by_default()
    {
        $post = factory(Post::class)->create([
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($post->user, 'canvas')
             ->getJson('canvas/api/posts')
             ->assertSuccessful()
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment($post->id, 'posts.data.0.id')
             ->assertJsonExactFragment(0, 'draftCount')
             ->assertJsonExactFragment(1, 'publishedCount')
             ->assertJsonExactFragment(0, 'views_count');
    }

    /** @test */
    public function it_can_fetch_published_posts_with_a_given_query_param()
    {
        $post = factory(Post::class)->create([
            'published_at' => now()->subDay(),
        ]);

        $this->actingAs($post->user, 'canvas')
             ->getJson('canvas/api/posts?type=published')
             ->assertSuccessful()
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment($post->id, 'posts.data.0.id')
             ->assertJsonExactFragment(0, 'draftCount')
             ->assertJsonExactFragment(1, 'publishedCount')
             ->assertJsonExactFragment(0, 'views_count');
    }

    /** @test */
    public function it_can_fetch_draft_posts_with_a_given_query_param()
    {
        $post = factory(Post::class)->create([
            'published_at' => now()->addDay(),
        ]);

        $this->actingAs($post->user, 'canvas')
             ->getJson('canvas/api/posts?type=draft')
             ->assertSuccessful()
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment($post->id, 'posts.data.0.id')
             ->assertJsonExactFragment(1, 'draftCount')
             ->assertJsonExactFragment(0, 'publishedCount')
             ->assertJsonExactFragment(0, 'views_count');
    }

    /** @test */
    public function it_fetches_user_posts_by_default()
    {
        $user = factory(User::class)->create();

        $post = factory(Post::class)->create([
            'user_id' => $user->id,
        ]);

        $this->actingAs($user, 'canvas')
             ->getJson('canvas/api/posts')
             ->assertSuccessful()
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment($post->user_id, 'posts.data.0.user_id')
             ->assertJsonExactFragment(0, 'draftCount')
             ->assertJsonExactFragment(1, 'publishedCount')
             ->assertJsonExactFragment(0, 'views_count');
    }

    /** @test */
    public function it_can_fetch_all_posts_with_a_given_query_param()
    {
        $user = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);

        $post = factory(Post::class)->create([
            'user_id' => $user->id,
        ]);

        factory(Post::class, 3)->create();

        $this->actingAs($post->user, 'canvas')
             ->getJson('canvas/api/posts?scope=all')
             ->assertSuccessful()
             ->assertJsonExactFragment(4, 'posts.total')
             ->assertJsonExactFragment(0, 'views_count');
    }

    /** @test */
    public function it_can_fetch_user_posts_with_a_given_query_param()
    {
        $user = factory(User::class)->create();

        $post = factory(Post::class)->create([
            'user_id' => $user->id,
        ]);

        factory(Post::class, 2)->create();

        $this->actingAs($post->user, 'canvas')
             ->getJson('canvas/api/posts?scope=user')
             ->assertSuccessful()
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment(0, 'views_count');
    }

    /** @test */
    public function it_can_fetch_data_for_a_new_post()
    {
        $user = factory(User::class)->create();

        $response = $this->actingAs($user, 'canvas')
                         ->getJson('canvas/api/posts/create')
                         ->assertSuccessful();

        $this->assertArrayHasKey('id', $response->original['post']);
        $this->assertArrayHasKey('slug', $response->original['post']);
        $this->assertArrayHasKey('read_time', $response->original['post']);
        $this->assertArrayHasKey('tags', $response->original);
        $this->assertArrayHasKey('topics', $response->original);
    }

    /** @test */
    public function it_can_fetch_an_existing_post()
    {
        $post = factory(Post::class)->create();

        $this->actingAs($post->user, 'canvas')
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
        $user = factory(User::class)->create();

        $this->actingAs($user, 'canvas')->getJson('canvas/api/posts/not-a-post')->assertNotFound();
    }

    /** @test */
    public function it_returns_404_if_contributor_tries_to_access_a_post_that_belongs_to_another_user()
    {
        $userOne = factory(User::class)->create([
            'role' => User::ADMIN,
        ]);
        $userTwo = factory(User::class)->create([
            'role' => User::CONTRIBUTOR,
        ]);

        $post = factory(Post::class)->create([
            'user_id' => $userOne->id,
        ]);

        $this->actingAs($userOne, 'canvas')->getJson("canvas/api/posts/{$post->id}")->assertSuccessful();
        $this->actingAs($userTwo, 'canvas')->getJson("canvas/api/posts/{$post->id}")->assertNotFound();
    }

    /** @test */
    public function it_can_store_a_new_post()
    {
        $user = factory(User::class)->create();

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'a-new-post',
            'title' => 'A new post',
        ];

        $response = $this->actingAs($user, 'canvas')
                         ->postJson("canvas/api/posts/{$data['id']}", $data)
                         ->assertSuccessful()
                         ->assertJsonExactFragment($data['id'], 'id')
                         ->assertJsonExactFragment($data['slug'], 'slug')
                         ->assertJsonExactFragment($user->id, 'user_id');

        $this->assertArrayHasKey('id', $response);
        $this->assertArrayHasKey('slug', $response);
        $this->assertArrayHasKey('title', $response);
        $this->assertArrayHasKey('user_id', $response);
    }

    /** @test */
    public function it_can_update_an_existing_post()
    {
        $post = factory(Post::class)->create([
            'title' => 'Original Title',
            'slug' => 'original-slug',
        ]);

        $data = [
            'title' => 'Updated Title',
            'slug' => 'updated-slug',
        ];

        $response = $this->actingAs($post->user, 'canvas')->postJson("canvas/api/posts/{$post->id}", $data)->assertSuccessful();

        $this->assertSame($data['title'], $response->original['title']);
        $this->assertSame($data['slug'], $response->original['slug']);

        $this->assertArrayHasKey('published_at', $response);
    }

    /** @test */
    public function it_can_sync_related_taxonomy()
    {
        $user = factory(User::class)->create();

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'a-new-post',
            'title' => 'A new post',
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
                [
                    'name' => 'A new topic',
                    'slug' => 'a-new-topic',
                ],
            ],
        ];

        $this->actingAs($user, 'canvas')
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
    public function it_will_not_store_an_invalid_slug()
    {
        $post = factory(Post::class)->create();

        $response = $this->actingAs($post->user, 'canvas')->postJson("canvas/api/posts/{$post->id}", [
            'slug' => 'a new.slug',
        ])->assertStatus(422);

        $this->assertArrayHasKey('slug', $response->original['errors']);
    }

    /** @test */
    public function it_can_delete_a_post()
    {
        $userOne = factory(User::class)->create();
        $userTwo = factory(User::class)->create();

        $post = factory(Post::class)->create([
            'user_id' => $userOne->id,
            'slug' => 'a-new-post',
        ]);

        $this->actingAs($userTwo, 'canvas')->deleteJson("canvas/api/posts/{$post->id}")->assertNotFound();

        $this->actingAs($userOne, 'canvas')->deleteJson('canvas/api/posts/not-a-post')->assertNotFound();

        $this->actingAs($userOne, 'canvas')->deleteJson("canvas/api/posts/{$post->id}")->assertSuccessful()->assertNoContent();

        $this->assertSoftDeleted('canvas_posts', [
            'id' => $post->id,
            'slug' => $post->slug,
        ]);
    }

    /** @test */
    public function it_can_de_sync_related_taxonomy()
    {
        $user = factory(User::class)->create();

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

        $this->actingAs($user, 'canvas')->deleteJson("canvas/api/posts/{$post->id}")->assertSuccessful()->assertNoContent();

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
