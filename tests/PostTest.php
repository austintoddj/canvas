<?php

namespace Canvas\Tests;

use Canvas\Post;
use Illuminate\Support\Str;

class PostTest extends TestCase
{
    /** @test */
    public function calculate_human_friendly_read_time()
    {
        $this->loadFactoriesUsing($this->app, __DIR__.'/../src/Storage/factories');

        $post = factory(Post::class)->create();

        $minutes = ceil(str_word_count($post->body) / 250);

        $this->assertSame($post->readTime, sprintf('%d %s %s', $minutes, Str::plural('min', $minutes), 'read'));
    }
}
