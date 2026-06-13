<?php

use Canvas\Models\Post;
use Canvas\Models\Visit;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

it('post relationship', function (): void {
    $post = Post::factory()->create();

    $visit = Visit::factory()->create([
        'post_id' => $post->id,
    ]);

    $post->visits()->saveMany([$visit]);

    $this->assertInstanceOf(BelongsTo::class, $visit->post());
    $this->assertInstanceOf(Post::class, $visit->post()->first());
});
