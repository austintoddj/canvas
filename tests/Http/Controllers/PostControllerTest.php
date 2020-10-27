<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class PostControllerTest.
 *
 * @covers \Canvas\Http\Controllers\PostController
 * @covers \Canvas\Http\Requests\PostRequest
 */
class PostControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     * @throws Exception
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->registerAssertJsonExactFragmentMacro();
    }

    public function testPublishedPostsAreFetchedByDefault(): void
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

    public function testPublishedPostsCanBeFetchedWithAGivenQueryType(): void
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

    public function testDraftPostsCanBeFetchedWithAGivenQueryType(): void
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

    public function testUserPostsAreFetchedByDefault(): void
    {
        factory(Post::class)->create([
            'user_id' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts')
             ->assertSuccessful()
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment($this->admin->id, 'posts.data.0.user_id')
             ->assertJsonExactFragment(0, 'draftCount')
             ->assertJsonExactFragment(1, 'publishedCount')
             ->assertJsonExactFragment(0, 'views_count');
    }

    public function testAllPostsCanBeFetchedWithAGivenQueryScope(): void
    {
        factory(Post::class)->create([
            'user_id' => $this->admin->id,
        ]);

        factory(Post::class, 3)->create();

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts?scope=all')
             ->assertSuccessful()
             ->assertJsonExactFragment(4, 'posts.total')
             ->assertJsonExactFragment(0, 'views_count');
    }

    /** @test */
    public function testUserPostsCanBeFetchedWithAGivenQueryScope(): void
    {
        factory(Post::class)->create([
            'user_id' => $this->admin->id,
        ]);

        factory(Post::class, 2)->create();

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/posts?scope=user')
             ->assertSuccessful()
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment(0, 'views_count');
    }

    public function testNewPostData(): void
    {
        $response = $this->actingAs($this->admin, 'canvas')
                         ->getJson('canvas/api/posts/create')
                         ->assertSuccessful();

        $this->assertArrayHasKey('id', $response->original['post']);
        $this->assertArrayHasKey('slug', $response->original['post']);
        $this->assertArrayHasKey('read_time', $response->original['post']);
        $this->assertArrayHasKey('tags', $response->original);
        $this->assertArrayHasKey('topics', $response->original);
    }

    public function testExistingPostData(): void
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

    public function testPostNotFound(): void
    {
        $this->actingAs($this->admin, 'canvas')->getJson('canvas/api/posts/not-a-post')->assertNotFound();
    }

    public function testContributorAccessRestricted(): void
    {
        $post = factory(Post::class)->create([
            'user_id' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'canvas')->getJson("canvas/api/posts/{$post->id}")->assertSuccessful();
        $this->actingAs($this->contributor, 'canvas')->getJson("canvas/api/posts/{$post->id}")->assertNotFound();
    }

    public function testStoreNewPost(): void
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'a-new-post',
            'title' => 'A new post',
        ];

        $response = $this->actingAs($this->admin, 'canvas')
                         ->postJson("canvas/api/posts/{$data['id']}", $data)
                         ->assertSuccessful()
                         ->assertJsonExactFragment($data['id'], 'id')
                         ->assertJsonExactFragment($data['slug'], 'slug')
                         ->assertJsonExactFragment($this->admin->id, 'user_id');

        $this->assertArrayHasKey('id', $response);
        $this->assertArrayHasKey('slug', $response);
        $this->assertArrayHasKey('title', $response);
        $this->assertArrayHasKey('user_id', $response);
    }

    public function testUpdateExistingPost(): void
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

    public function testSyncNewTags(): void
    {
    }

    public function testSyncNewTopic(): void
    {
    }

    public function testSyncExistingTags(): void
    {
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

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/posts/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['id'], 'id')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($this->admin->id, 'user_id');

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

    public function testSyncExistingTopic(): void
    {
    }

    public function testInvalidSlugsAreValidated(): void
    {
        $post = factory(Post::class)->create();

        $response = $this->actingAs($post->user, 'canvas')->postJson("canvas/api/posts/{$post->id}", [
            'slug' => 'a new.slug',
        ])->assertStatus(422);

        $this->assertArrayHasKey('slug', $response->original['errors']);
    }

    public function testDeleteExistingPost(): void
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

    public function testDeSyncRelatedTaxonomy(): void
    {
        $post = factory(Post::class)->create([
            'user_id' => $this->admin->id,
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

        $this->actingAs($this->admin, 'canvas')->deleteJson("canvas/api/posts/{$post->id}")->assertSuccessful()->assertNoContent();

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
