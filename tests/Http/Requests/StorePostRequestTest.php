<?php

namespace Canvas\Tests\Http\Requests;

use Canvas\Models\Post;
use Canvas\Models\User;
use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class StorePostRequestTest.
 *
 * @covers \Canvas\Http\Requests\StorePostRequest
 */
class StorePostRequestTest extends TestCase
{
    use RefreshDatabase;

    public function testSlugIsRequired(): void
    {
        $post = Post::factory()->for(User::factory())->create();

        $this->actingAs($post->user, 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => $post->id]), [
                'title' => $post->title,
                'user_id' => $post->user->id,
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'slug',
                ],
            ]);
    }

    public function testSlugMustBeAlphaDash(): void
    {
        $post = Post::factory()->for(User::factory())->create();

        $this->actingAs($post->user, 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => $post->id]), [
                'slug' => 'a new.slug',
                'title' => $post->title,
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'slug',
                ],
            ]);
    }

    public function testPostsCanShareTheSameSlugWithUniqueUsers(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => Uuid::uuid4()->toString()]), [
                'slug' => 'a-new-post',
                'title' => 'A new post',
                'user_id' => $admin->id,
            ]);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $response->original['id'],
            'slug' => $response->original['slug'],
            'user_id' => $response->original['user_id'],
        ]);

        $editor = User::factory()->editor()->create();

        $response = $this->actingAs($editor, 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => Uuid::uuid4()->toString()]), [
                'slug' => 'a-new-post',
                'title' => 'A new post',
                'user_id' => $editor->id,
            ]);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $response->original['id'],
            'slug' => $response->original['slug'],
            'user_id' => $response->original['user_id'],
        ]);
    }

    public function testTitleIsRequired(): void
    {
        $post = Post::factory()->for(User::factory())->create();

        $this->actingAs($post->user, 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => $post->id]), [
                'slug' => 'a-new-post',
                'user_id' => $post->user->id,
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'title',
                ],
            ]);
    }

    public function testUserIdIsRequired(): void
    {
        $post = Post::factory()->for(User::factory())->create();

        $this->actingAs($post->user, 'canvas')
            ->putJson(route('canvas.posts.store', ['id' => $post->id]), [
                'slug' => 'a-new-post',
                'title' => 'A new post',
            ])
            ->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'user_id',
                ],
            ]);
    }
}
