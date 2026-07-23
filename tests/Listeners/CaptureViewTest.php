<?php

use Canvas\Events\PostViewed;
use Canvas\Listeners\CaptureView;
use Canvas\Models\Post;

function makeViewEvent(Post $post, string $agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'): PostViewed
{
    return new PostViewed(
        post: $post,
        ip: '127.0.0.1',
        agent: $agent,
        referer: 'https://google.com/search',
    );
}

it('records a view on first load', function (): void {
    $post = Post::factory()->create();
    $listener = new CaptureView;

    $listener->handle(makeViewEvent($post));

    $this->assertDatabaseHas('canvas_views', [
        'post_id' => $post->id,
        'ip' => '127.0.0.1',
        'referer' => 'google.com',
    ]);
    $this->assertCount(1, $post->views);
});

it('counts views in the session once per hour', function (): void {
    $post = Post::factory()->create();
    $listener = new CaptureView;
    $event = makeViewEvent($post);

    $listener->handle($event);
    $listener->handle($event);

    $this->assertCount(1, $post->views);
});

it('does not record a view for bot user-agents', function (): void {
    $post = Post::factory()->create();
    $listener = new CaptureView;

    $listener->handle(makeViewEvent($post, 'Googlebot/2.1 (+http://www.google.com/bot.html)'));

    $this->assertDatabaseMissing('canvas_views', ['post_id' => $post->id]);
});

it('does not record a view for a null user-agent', function (): void {
    $post = Post::factory()->create();
    $listener = new CaptureView;

    $listener->handle(new PostViewed(post: $post, ip: '127.0.0.1', agent: null, referer: null));

    $this->assertDatabaseMissing('canvas_views', ['post_id' => $post->id]);
});
