<?php

namespace Canvas\Tests;

use Canvas\Http\Middleware\Session;
use Canvas\Post;
use Canvas\Tag;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

class TagTest extends TestCase
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
    public function tags_can_share_the_same_slug_with_unique_users()
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A new tag',
            'slug' => 'a-new-tag',
        ];

        $tag_1 = factory(Tag::class)->create();
        $response = $this->actingAs($tag_1->user)->postJson("/canvas/api/tags/{$tag_1->id}", $data);

        $this->assertDatabaseHas('canvas_tags', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);

        $tag_2 = factory(Tag::class)->create();
        $response = $this->actingAs($tag_2->user)->postJson("/canvas/api/tags/{$tag_2->id}", $data);

        $this->assertDatabaseHas('canvas_tags', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);
    }

    /** @test */
    public function posts_relationship()
    {
        $tag = factory(Tag::class)->create();
        $post = factory(Post::class)->create();

        $post->tags()->sync($tag);

        $this->assertCount(1, $post->tags);
        $this->assertInstanceOf(Post::class, $tag->posts->first());
    }

    /** @test */
    public function user_relationship()
    {
        $tag = factory(Tag::class)->create();

        $this->assertInstanceOf(config('canvas.user'), $tag->user);
    }

    /** @test */
    public function for_user_scope()
    {
        $user = factory(config('canvas.user'))->create();

        $tag = factory(Tag::class)->create([
            'user_id' => $user->id,
        ]);

        $this->assertEquals(1, $tag->forUser($user)->count());
    }
}
