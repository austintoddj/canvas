<?php

use Canvas\Events\PostViewed;
use Canvas\Listeners\CaptureVisit;
use Canvas\Models\Post;

function makeVisitEvent(Post $post, string $ip = '127.0.0.1', string $agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'): PostViewed
{
    return new PostViewed(
        post: $post,
        ip: $ip,
        agent: $agent,
        referer: null,
    );
}

it('records a visit on first load', function (): void {
    $post = Post::factory()->create();
    $listener = new CaptureVisit;

    $listener->handle(makeVisitEvent($post));

    $this->assertDatabaseHas('canvas_visits', [
        'post_id' => $post->id,
        'ip' => '127.0.0.1',
    ]);
    $this->assertCount(1, $post->visits);
});

it('counts visits by IP in the session once per day', function (): void {
    $post = Post::factory()->create();
    $listener = new CaptureVisit;
    $event = makeVisitEvent($post);

    $listener->handle($event);
    $listener->handle($event);

    $this->assertCount(1, $post->visits);
});

it('records a second visit from a different IP', function (): void {
    $post = Post::factory()->create();
    $listener = new CaptureVisit;

    $listener->handle(makeVisitEvent($post, '1.1.1.1'));
    $listener->handle(makeVisitEvent($post, '2.2.2.2'));

    $this->assertCount(2, $post->visits);
});

it('does not record a visit for bot user-agents', function (): void {
    $post = Post::factory()->create();
    $listener = new CaptureVisit;

    $listener->handle(makeVisitEvent($post, agent: 'AhrefsBot/7.0 (+http://ahrefs.com/robot/)'));

    $this->assertDatabaseMissing('canvas_visits', ['post_id' => $post->id]);
});
