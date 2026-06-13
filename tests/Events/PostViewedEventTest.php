<?php

use Canvas\Events\PostViewed;
use Canvas\Models\Post;

it('instantiation', function (): void {
    $post = Post::factory()->create();

    $event = new PostViewed($post);

    $this->assertInstanceOf(PostViewed::class, $event);
    $this->assertSame($post, $event->post);
});
