<?php

use Canvas\Events\PostViewed;
use Canvas\Listeners\CaptureView;
use Canvas\Models\Post;

it('instantiation', function (): void {
    $post = Post::factory()->create();

    $event = new PostViewed($post);

    $listener = new CaptureView;

    $listener->handle($event);

    $this->assertDatabaseHas('canvas_views', [
        'post_id' => $post->id,
    ]);

    $this->assertCount(1, $post->views);
});
it('views are counted in session once per hour', function (): void {
    $post = Post::factory()->create();

    $event = new PostViewed($post);

    $listener = new CaptureView;

    $listener->handle($event);
    $listener->handle($event);

    $this->assertDatabaseHas('canvas_views', [
        'post_id' => $post->id,
    ]);

    $this->assertCount(1, $post->views);
});
