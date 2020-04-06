<?php

namespace Canvas\Tests\Unit;

use Canvas\Post;
use Canvas\Tests\TestCase;
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
        $post_1 = $this->actingAs($user_1)->withoutMiddleware()->post('/canvas/api/posts', [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'a-new-hope',
        ]);

        $user_2 = factory(config('canvas.user'))->create();
        $post_2 = $this->actingAs($user_2)->withoutMiddleware()->post('/canvas/api/posts', [
            'id' => Uuid::uuid4()->toString(),
            'slug' => 'a-new-hope',
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
}
