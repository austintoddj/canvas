<?php

use Canvas\Models\Post;
use Canvas\Models\View;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

it('post relationship', function (): void {
    $post = Post::factory()->create();

    $view = View::factory()->create([
        'post_id' => $post->id,
    ]);

    $post->views()->saveMany([$view]);

    $this->assertInstanceOf(BelongsTo::class, $view->post());
    $this->assertInstanceOf(Post::class, $view->post()->first());
});
