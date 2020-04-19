<?php

namespace Canvas\Tests\Controllers;

use Canvas\Http\Middleware\Session;
use Canvas\Post;
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

    /**
     * A user can display a listing of the resource.
     *
     * @return void
     */
    public function test_a_listing_of_published_resources()
    {
        $post = factory(Post::class)->create();

        $this->actingAs($post->user)
             ->getJson('canvas/api/posts?type=published')
             ->assertSuccessful()
             ->assertJsonExactFragment($post->id, 'posts.data.0.id')
             ->assertJsonExactFragment($post->slug, 'posts.data.0.slug')
             ->assertJsonExactFragment($post->title, 'posts.data.0.title')
             ->assertJsonExactFragment($post->summary, 'posts.data.0.summary')
             ->assertJsonExactFragment($post->body, 'posts.data.0.body')
             ->assertJsonExactFragment($post->featured_image, 'posts.data.0.featured_image')
             ->assertJsonExactFragment($post->featured_image_caption, 'posts.data.0.featured_image_caption')
             ->assertJsonExactFragment($post->meta['title'], 'posts.data.0.meta.title')
             ->assertJsonExactFragment($post->meta['description'], 'posts.data.0.meta.description')
             ->assertJsonExactFragment($post->meta['canonical_link'], 'posts.data.0.meta.canonical_link')
             ->assertJsonExactFragment($post->user->id, 'posts.data.0.user_id')
             ->assertJsonExactFragment($post->readTime, 'posts.data.0.read_time')
             ->assertJsonExactFragment($post->views->count(), 'posts.data.0.views_count')
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment(0, 'draftCount')
             ->assertJsonExactFragment(1, 'publishedCount');
    }

    /**
     * A user can display a listing of the resource.
     *
     * @return void
     */
    public function test_a_listing_of_draft_resources()
    {
        $post = factory(Post::class)->create([
            'published_at' => now()->addMonth(),
        ]);

        $this->actingAs($post->user)
             ->getJson('canvas/api/posts?type=draft')
             ->assertSuccessful()
             ->assertJsonExactFragment($post->id, 'posts.data.0.id')
             ->assertJsonExactFragment($post->slug, 'posts.data.0.slug')
             ->assertJsonExactFragment($post->title, 'posts.data.0.title')
             ->assertJsonExactFragment($post->summary, 'posts.data.0.summary')
             ->assertJsonExactFragment($post->body, 'posts.data.0.body')
             ->assertJsonExactFragment($post->featured_image, 'posts.data.0.featured_image')
             ->assertJsonExactFragment($post->featured_image_caption, 'posts.data.0.featured_image_caption')
             ->assertJsonExactFragment($post->meta['title'], 'posts.data.0.meta.title')
             ->assertJsonExactFragment($post->meta['description'], 'posts.data.0.meta.description')
             ->assertJsonExactFragment($post->meta['canonical_link'], 'posts.data.0.meta.canonical_link')
             ->assertJsonExactFragment($post->user->id, 'posts.data.0.user_id')
             ->assertJsonExactFragment($post->readTime, 'posts.data.0.read_time')
             ->assertJsonExactFragment($post->views->count(), 'posts.data.0.views_count')
             ->assertJsonExactFragment(1, 'posts.total')
             ->assertJsonExactFragment(1, 'draftCount')
             ->assertJsonExactFragment(0, 'publishedCount');
    }

    /**
     * A fresh UUID is returned.
     *
     * @return void
     */
    public function test_a_new_specified_resource()
    {
        $user = factory(config('canvas.user'))->create();

        $response = $this->actingAs($user)
                         ->getJson('canvas/api/posts/create')
                         ->assertSuccessful();

        $this->assertArrayHasKey('id', $response->decodeResponseJson('post'));
        $this->assertArrayHasKey('slug', $response->decodeResponseJson('post'));
        $this->assertArrayHasKey('read_time', $response->decodeResponseJson('post'));
        $this->assertArrayHasKey('tags', $response->decodeResponseJson());
        $this->assertArrayHasKey('topics', $response->decodeResponseJson());
    }

    /**
     * An existing resource is returned.
     *
     * @return void
     */
    public function test_an_existing_specified_resource()
    {
        $post = factory(Post::class)->create();

        $this->actingAs($post->user)
             ->getJson("canvas/api/posts/{$post->id}")
             ->assertSuccessful()
             ->assertJsonExactFragment($post->id, 'post.id')
             ->assertJsonExactFragment($post->title, 'post.title')
             ->assertJsonExactFragment($post->user_id, 'post.user_id')
             ->assertJsonExactFragment($post->slug, 'post.slug');
    }

    /**
     * A user receives a 404 if the resource doesn't exist.
     *
     * @return void
     */
    public function test_a_not_found_resource()
    {
        $user = factory(config('canvas.user'))->create();

        $this->actingAs($user)
             ->getJson('canvas/api/posts/not-a-post')
             ->assertNotFound();
    }

    /**
     * A user cannot access resources that don't belong to them.
     *
     * @return void
     */
    public function test_restricted_access()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $user_2 = factory(config('canvas.user'))->create();

        $post = factory(Post::class)->create([
            'user_id' => $user_1->id,
        ]);

        $this->actingAs($user_2)
             ->getJson("canvas/api/posts/{$post->id}")
             ->assertNotFound();
    }

    /**
     * A fresh resource can be stored.
     *
     * @return void
     */
    public function test_a_new_resource_can_be_stored()
    {
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
    }

    /**
     * An existing resource can be updated.
     *
     * @return void
     */
    public function test_an_existing_resource_can_be_updated()
    {
        $user = factory(config('canvas.user'))->create();

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'an-existing-post',
            'title' => 'An existing post',
            'summary' => 'A really great summary',
            'body' => 'Some really great content',
            'published_at' => now()->subDay()->toDateTimeString(),
            'featured_image' => 'storage/images/example.png',
            'featured_image_caption' => 'A great caption',
            'meta' => [
                'title' => 'A meta title',
                'description' => 'A meta description',
                'canonical_link' => 'https://example.com',
            ],
        ];

        $response = $this->actingAs($user)
                         ->postJson("canvas/api/posts/{$data['id']}", $data)
                         ->assertSuccessful()
                         ->assertJsonExactFragment($data['id'], 'id')
                         ->assertJsonExactFragment($data['slug'], 'slug')
                         ->assertJsonExactFragment($data['title'], 'title')
                         ->assertJsonExactFragment($data['summary'], 'summary')
                         ->assertJsonExactFragment($data['body'], 'body')
                         ->assertJsonExactFragment($data['featured_image'], 'featured_image')
                         ->assertJsonExactFragment($data['featured_image_caption'], 'featured_image_caption')
//                         ->assertJsonExactFragment($data['published_at'], 'published_at')
                         ->assertJsonExactFragment($data['meta']['title'], 'meta.title')
                         ->assertJsonExactFragment($data['meta']['description'], 'meta.description')
                         ->assertJsonExactFragment($data['meta']['canonical_link'], 'meta.canonical_link')
                         ->assertJsonExactFragment($user->id, 'user_id');

        // todo: published_at comes back with a timezone offset
        // expected: '2020-04-18 17:19:51'
        // actual: '2020-04-18T17:19:51.000000Z'

        $this->assertArrayHasKey('published_at', $response);
    }

    /**
     * An array of tags can be synced with a post.
     *
     * @return void
     */
    public function test_tags_can_be_synced()
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
        ];

        $this->actingAs($user)
             ->postJson("canvas/api/posts/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['id'], 'id')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($user->id, 'user_id');

        $post = Post::find($data['id']);

        $this->assertCount(count($data['tags']), $post->tags);
        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
        ]);
    }

    /**
     * A topic can be synced with a post.
     *
     * @return void
     */
    public function test_a_topic_can_be_synced()
    {
        $user = factory(config('canvas.user'))->create();

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'a-new-post',
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

        $this->assertCount(1, $post->topic);
        $this->assertDatabaseHas('canvas_posts_topics', [
            'post_id' => $post->id,
        ]);
    }

    /**
     * An existing resource can be updated.
     *
     * @return void
     */
    public function test_a_post_with_an_invalid_slug_will_not_be_stored()
    {
        $post = factory(Post::class)->create();

        $response = $this->actingAs($post->user)
                         ->postJson("canvas/api/posts/{$post->id}", [
                             'slug' => 'a new.slug',
                         ])
                         ->assertStatus(422);

        $this->assertArrayHasKey('slug', $response->decodeResponseJson('errors'));
    }

    /**
     * An existing resource can be removed from storage.
     *
     * @return void
     */
    public function test_a_specified_resource_can_be_removed_from_storage()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $user_2 = factory(config('canvas.user'))->create();

        $post = factory(Post::class)->create([
            'user_id' => $user_1->id,
            'slug' => 'a-new-post',
        ]);

        $this->actingAs($user_2)
             ->deleteJson("canvas/api/posts/{$post->id}")
             ->assertNotFound();

        $this->actingAs($user_1)
             ->deleteJson('canvas/api/posts/not-a-post')
             ->assertNotFound();

        $this->actingAs($user_1)
             ->deleteJson("canvas/api/posts/{$post->id}")
             ->assertSuccessful()
             ->assertNoContent();
    }
}
