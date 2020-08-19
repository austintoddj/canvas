<?php

namespace Canvas\Tests\Models;

use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\UserMeta;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Ramsey\Uuid\Uuid;

/**
 * Class TagTest.
 *
 * @covers \Canvas\Models\Tag
 */
class TagTest extends TestCase
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
    public function tags_can_share_the_same_slug_with_unique_users()
    {
        $data = [
            'id' => Uuid::uuid4()->toString(),
            'name' => 'A new tag',
            'slug' => 'a-new-tag',
        ];

        $tagOne = factory(Tag::class)->create();

        factory(UserMeta::class)->create([
            'user_id' => $tagOne->user->id,
            'admin' => 1,
        ]);

        $response = $this->actingAs($tagOne->user)->postJson("/canvas/api/tags/{$tagOne->id}", $data);

        $this->assertDatabaseHas('canvas_tags', [
            'id' => $response->decodeResponseJson('id'),
            'slug' => $response->decodeResponseJson('slug'),
            'user_id' => $response->decodeResponseJson('user_id'),
        ]);

        $tagTwo = factory(Tag::class)->create();

        factory(UserMeta::class)->create([
            'user_id' => $tagTwo->user->id,
            'admin' => 1,
        ]);

        $response = $this->actingAs($tagTwo->user)->postJson("/canvas/api/tags/{$tagTwo->id}", $data);

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
    public function userMeta_relationship()
    {
        $tag = factory(Tag::class)->create();

        factory(UserMeta::class)->create([
            'user_id' => $tag->user->id,
        ]);

        $this->assertInstanceOf(UserMeta::class, $tag->userMeta);
    }

    /** @test */
    public function it_will_detach_posts_on_delete()
    {
        $tag = factory(Tag::class)->create();
        $post = factory(Post::class)->create();

        $tag->posts()->sync([$post->id]);

        $tag->delete();

        $this->assertEquals(0, $tag->posts->count());
        $this->assertDatabaseMissing('canvas_posts_tags', [
            'post_id' => $post->id,
            'tag_id' => $tag->id,
        ]);
    }
}
