<?php

use Canvas\Events\PostViewed;
use Canvas\Models\Post;

it('can be instantiated with request context', function (): void {
    $post = Post::factory()->create();

    $event = new PostViewed(
        post: $post,
        ip: '127.0.0.1',
        agent: 'Mozilla/5.0',
        referer: 'https://google.com',
    );

    $this->assertInstanceOf(PostViewed::class, $event);
    $this->assertSame($post, $event->post);
    $this->assertSame('127.0.0.1', $event->ip);
    $this->assertSame('Mozilla/5.0', $event->agent);
    $this->assertSame('https://google.com', $event->referer);
});

it('accepts null agent and referer', function (): void {
    $post = Post::factory()->create();

    $event = new PostViewed(post: $post, ip: '10.0.0.1', agent: null, referer: null);

    $this->assertNull($event->agent);
    $this->assertNull($event->referer);
});
