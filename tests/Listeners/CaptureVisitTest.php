<?php

use Canvas\Events\PostViewed;
use Canvas\Listeners\CaptureVisit;
use Canvas\Models\Post;

it('instantiation', function (): void {
    $post = Post::factory()->create();

    $event = new PostViewed($post);

    $listener = new CaptureVisit;

    $listener->handle($event);
    $listener->handle($event);

    $this->assertDatabaseHas('canvas_visits', [
        'post_id' => $post->id,
    ]);

    $this->assertCount(1, $post->visits);
});
it('visits are counted by ip in session once per day', function (): void {
    $post = Post::factory()->create();

    $event = new PostViewed($post);

    $listener = new CaptureVisit;

    $listener->handle($event);
    $listener->handle($event);

    $this->assertDatabaseHas('canvas_visits', [
        'post_id' => $post->id,
    ]);

    $this->assertCount(1, $post->visits);
});
