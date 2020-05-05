<?php

namespace Canvas\Tests;

use Canvas\Post;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

class PostTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function calculate_human_friendly_read_time()
    {
        $post = factory(Post::class)->create();

        $minutes = ceil(str_word_count($post->body) / 250);

        $this->assertSame($post->readTime, sprintf('%d %s %s', $minutes, Str::plural(__('canvas::app.min'), $minutes), __('canvas::app.read')));
    }

    /** @test */
    public function allow_posts_to_share_the_same_slug_with_unique_users()
    {
        $user_1 = factory(config('canvas.user'))->create();
        $post_1 = $this->actingAs($user_1)->withoutMiddleware()->post('/canvas/api/posts/create', [
            'id' => Uuid::uuid4(),
            'slug' => 'a-new-hope',
            'topic' => [],
            'tags' => [],
        ]);

        $user_2 = factory(config('canvas.user'))->create();
        $post_2 = $this->actingAs($user_2)->withoutMiddleware()->post('/canvas/api/posts/create', [
            'id' => Uuid::uuid4(),
            'slug' => 'a-new-hope',
            'topic' => [],
            'tags' => [],
        ]);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $post_1->decodeResponseJson()['id'],
            'slug' => $post_1->decodeResponseJson()['slug'],
            'user_id' => $post_1->decodeResponseJson()['user_id'],
        ]);

        $this->assertDatabaseHas('canvas_posts', [
            'id' => $post_2->decodeResponseJson()['id'],
            'slug' => $post_2->decodeResponseJson()['slug'],
            'user_id' => $post_2->decodeResponseJson()['user_id'],
        ]);
    }

    /** @test */
    public function correctly_order_pinned_published_posts()
    {
        $publishedPosts = factory(Post::class, 8)->create();
        $pinnedPostOne = factory(Post::class)->create([
            'published_at' => now()->subDay(1),
            'is_pinned' => true,
        ]);
        $pinnedPostTwo = factory(Post::class)->create([
            'published_at' => now()->subDay(2),
            'is_pinned' => true,
        ]);

        $posts = Post::posts()->get();

        $this->assertEquals($posts->first()->id, $pinnedPostOne->id);
        $this->assertEquals($posts->get(1)->id, $pinnedPostTwo->id);
        $this->assertEquals($posts->count(), 10);

        $unpinnedPosts = $posts->slice(2);
        foreach ($unpinnedPosts as $post) {
            $this->assertTrue($post->is_pinned === '0');
        }
    }
}
