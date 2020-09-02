<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Http\Middleware\Admin;
use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\View;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class TagControllerTest.
 *
 * @covers \Canvas\Http\Controllers\TagController
 */
class TagControllerTest extends TestCase
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
    public function it_can_fetch_tags()
    {
        $tag = factory(Tag::class)->create();

        $this->actingAs($tag->user)
             ->getJson('canvas/api/tags')
             ->assertSuccessful()
             ->assertJsonExactFragment($tag->id, 'data.0.id')
             ->assertJsonExactFragment($tag->name, 'data.0.name')
             ->assertJsonExactFragment($tag->user->id, 'data.0.user_id')
             ->assertJsonExactFragment($tag->slug, 'data.0.slug')
             ->assertJsonExactFragment($tag->posts->count(), 'data.0.posts_count')
             ->assertJsonExactFragment(1, 'total');
    }

    /** @test */
    public function it_can_fetch_a_new_tag()
    {
        $user = factory(config('canvas.user'))->create();

        $response = $this->actingAs($user)->getJson('canvas/api/tags/create')->assertSuccessful();

        $this->assertArrayHasKey('id', $response->decodeResponseJson());
    }

    /** @test */
    public function it_can_fetch_an_existing_tag()
    {
        $tag = factory(Tag::class)->create();

        $this->actingAs($tag->user)
             ->getJson("canvas/api/tags/{$tag->id}")
             ->assertSuccessful()
             ->assertJsonExactFragment($tag->id, 'id')
             ->assertJsonExactFragment($tag->name, 'name')
             ->assertJsonExactFragment($tag->user->id, 'user_id')
             ->assertJsonExactFragment($tag->slug, 'slug');
    }

    /** @test */
    public function it_can_fetch_posts_for_an_existing_tag()
    {
        $tag = factory(Tag::class)->create();
        $post = factory(Post::class)->create();
        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $tag->posts()->sync([$post->id]);

        $response = $this->actingAs($tag->user)
             ->getJson("canvas/api/tags/{$tag->id}/posts")
             ->assertSuccessful();

        $this->assertIsArray($response->decodeResponseJson('data'));
        $this->assertCount(1, $response->decodeResponseJson('data'));
        $this->assertArrayHasKey('views_count', $response->decodeResponseJson('data.0'));
        $this->assertEquals(1, $response->decodeResponseJson('data.0.views_count'));
    }

    /** @test */
    public function it_returns_404_if_no_tag_is_found()
    {
        $user = factory(config('canvas.user'))->create();

        $this->actingAs($user)->getJson('canvas/api/tags/not-a-tag')->assertNotFound();
    }

    /** @test */
    public function it_can_create_a_new_tag()
    {
        $user = factory(config('canvas.user'))->create();

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A new tag',
            'slug' => 'a-new-tag',
        ];

        $this->actingAs($user)
             ->postJson("canvas/api/tags/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['name'], 'name')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($user->id, 'user_id');
    }

    /** @test */
    public function it_can_refresh_a_deleted_tag()
    {
        $user = factory(config('canvas.user'))->create();
        $tag = factory(Tag::class)->create([
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A deleted tag',
            'slug' => 'a-deleted-tag',
            'user_id' => $user->id,
            'deleted_at' => now(),
        ]);

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => $tag->name,
            'slug' => $tag->slug,
            'user_id' => $user->id,
        ];

        $this->actingAs($user)
             ->postJson("canvas/api/tags/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['name'], 'name')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($user->id, 'user_id');
    }

    /** @test */
    public function it_can_update_an_existing_tag()
    {
        $tag = factory(Tag::class)->create();

        $data = [
            'name' => 'An updated tag',
            'slug' => 'an-updated-tag',
        ];

        $this->actingAs($tag->user)
             ->postJson("canvas/api/tags/{$tag->id}", $data)
             ->assertSuccessful()
             ->assertJsonExactFragment($data['name'], 'name')
             ->assertJsonExactFragment($data['slug'], 'slug')
             ->assertJsonExactFragment($tag->user->id, 'user_id');
    }

    /** @test */
    public function it_will_not_store_an_invalid_slug()
    {
        $tag = factory(Tag::class)->create();

        $response = $this->actingAs($tag->user)
                         ->postJson("canvas/api/tags/{$tag->id}", [
                             'name' => 'A new tag',
                             'slug' => 'a new.slug',
                         ])
                         ->assertStatus(422);

        $this->assertArrayHasKey('slug', $response->decodeResponseJson('errors'));
    }

    /** @test */
    public function it_can_delete_a_tag()
    {
        $tag = factory(Tag::class)->create([
            'name' => 'A new tag',
            'slug' => 'a-new-tag',
        ]);

        $this->actingAs($tag->user)
             ->deleteJson('canvas/api/tags/not-a-tag')
             ->assertNotFound();

        $this->actingAs($tag->user)
             ->deleteJson("canvas/api/tags/{$tag->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_tags', [
            'id' => $tag->id,
            'slug' => $tag->slug,
        ]);
    }

    /** @test */
    public function it_can_de_sync_the_post_relationship()
    {
        $tag = factory(Tag::class)->create();

        $post = factory(Post::class)->create([
            'user_id' => $tag->user->id,
            'slug' => 'a-new-post',
        ]);

        $tag->posts()->sync([$post->id]);

        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);

        $this->assertCount(1, $tag->posts);

        $this->actingAs($tag->user)->deleteJson("canvas/api/posts/{$post->id}")->assertSuccessful()->assertNoContent();

        $this->assertSoftDeleted('canvas_posts', [
            'id' => $post->id,
            'slug' => $post->slug,
        ]);

        $this->assertDatabaseMissing('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);

        $this->assertCount(0, $tag->refresh()->posts);
    }
}
