<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use App\Models\User;
use Canvas\Models\View;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class TagControllerTest.
 *
 * @covers \Canvas\Http\Controllers\TagController
 * @covers \Canvas\Http\Requests\TagRequest
 */
class TagControllerTest extends TestCase
{
    use RefreshDatabase;

    public function testAnAdminCanFetchAllTags(): void
    {
        $tag = factory(Tag::class)->create([
            'user_id' => factory(User::class)->create([
                'role' => User::ADMIN,
            ]),
        ]);

        factory(Tag::class, 4)->create();

        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/tags')
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $tag->id,
                 'name' => $tag->name,
                 'user_id' => $tag->user->id,
                 'slug' => $tag->slug,
                 'posts_count' => (string) $tag->posts->count(),
                 'total' => 5,
             ]);
    }

    public function testNewPostData(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/tags/create')
             ->assertSuccessful()
             ->assertJsonStructure([
                 'id',
             ]);
    }

    public function testExistingPostData(): void
    {
        $tag = factory(Tag::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->getJson("canvas/api/tags/{$tag->id}")
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $tag->id,
                 'name' => $tag->name,
                 'user_id' => $tag->user->id,
                 'slug' => $tag->slug,
             ]);
    }

    public function testPostsCanBeFetchedForATag(): void
    {
        $tag = factory(Tag::class)->create();
        $post = factory(Post::class)->create();

        factory(View::class)->create([
            'post_id' => $post->id,
        ]);

        $tag->posts()->sync([$post->id]);

        $this->actingAs($this->admin, 'canvas')
             ->getJson("canvas/api/tags/{$tag->id}/posts")
             ->assertSuccessful()
             ->assertJsonFragment([
                 'tag_id' => $tag->id,
                 'post_id' => $post->id,
                 'views_count' => (string) $post->views->count(),
             ]);
    }

    public function testTagNotFound(): void
    {
        $this->actingAs($this->admin, 'canvas')
             ->getJson('canvas/api/tags/not-a-tag')
             ->assertNotFound();
    }

    public function testStoreNewTag(): void
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A new tag',
            'slug' => 'a-new-tag',
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/tags/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $data['id'],
                 'name' => $data['name'],
                 'slug' => $data['slug'],
                 'user_id' => $this->admin->id,
             ]);
    }

    public function testADeletedTagCanBeRefreshed(): void
    {
        $deletedTag = factory(Tag::class)->create([
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A deleted tag',
            'slug' => 'a-deleted-tag',
            'user_id' => $this->editor->id,
            'deleted_at' => now(),
        ]);

        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => $deletedTag->name,
            'slug' => $deletedTag->slug,
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/tags/{$data['id']}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $deletedTag->id,
                 'name' => $deletedTag->name,
                 'slug' => $deletedTag->slug,
                 'user_id' => $deletedTag->user_id,
             ]);
    }

    public function testUpdateExistingTag(): void
    {
        $tag = factory(Tag::class)->create();

        $data = [
            'name' => 'An updated tag',
            'slug' => 'an-updated-tag',
        ];

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/tags/{$tag->id}", $data)
             ->assertSuccessful()
             ->assertJsonFragment([
                 'id' => $tag->id,
                 'name' => $data['name'],
                 'slug' => $data['slug'],
                 'user_id' => $tag->user->id,
             ]);
    }

    public function testInvalidSlugsAreValidated(): void
    {
        $tag = factory(Tag::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->postJson("canvas/api/tags/{$tag->id}", [
                 'name' => 'A new tag',
                 'slug' => 'a new.slug',
             ])
             ->assertStatus(422)
             ->assertJsonStructure([
                 'errors' => [
                     'slug',
                 ],
             ]);
    }

    public function testDeleteExistingTag(): void
    {
        $tag = factory(Tag::class)->create();

        $this->actingAs($this->admin, 'canvas')
             ->deleteJson('canvas/api/tags/not-a-tag')
             ->assertNotFound();

        $this->actingAs($this->admin, 'canvas')
             ->deleteJson("canvas/api/tags/{$tag->id}")
             ->assertSuccessful()
             ->assertNoContent();

        $this->assertSoftDeleted('canvas_tags', [
            'id' => $tag->id,
            'slug' => $tag->slug,
        ]);
    }

    public function testDeSyncPostRelationship(): void
    {
        $tag = factory(Tag::class)->create();
        $post = factory(Post::class)->create();

        $tag->posts()->sync([$post->id]);

        $this->assertDatabaseHas('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);

        $this->assertCount(1, $tag->posts);

        $this->actingAs($this->admin, 'canvas')
             ->deleteJson("canvas/api/posts/{$post->id}")
             ->assertSuccessful()
             ->assertNoContent();

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
