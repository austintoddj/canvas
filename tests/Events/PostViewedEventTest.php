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

it('records views and visits through registered listeners', function (): void {
    $post = Post::factory()->create();

    $this->startSession();

    event(new PostViewed(
        post: $post,
        ip: '127.0.0.1',
        agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        referer: 'https://google.com/search',
    ));

    $this->assertDatabaseHas('canvas_views', [
        'post_id' => $post->id,
        'ip' => '127.0.0.1',
        'referer' => 'google.com',
    ]);

    $this->assertDatabaseHas('canvas_visits', [
        'post_id' => $post->id,
        'ip' => '127.0.0.1',
        'referer' => 'google.com',
    ]);
});

it('does not record analytics when dispatched with a bot user-agent', function (): void {
    $post = Post::factory()->create();

    $this->startSession();

    event(new PostViewed(
        post: $post,
        ip: '127.0.0.1',
        agent: 'Googlebot/2.1 (+http://www.google.com/bot.html)',
        referer: 'https://google.com/search',
    ));

    $this->assertDatabaseMissing('canvas_views', ['post_id' => $post->id]);
    $this->assertDatabaseMissing('canvas_visits', ['post_id' => $post->id]);
});
