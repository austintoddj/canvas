<?php

use Canvas\Events\PostDeleted;
use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;
use Canvas\Models\Post;
use Illuminate\Support\Str;

it('constructs lifecycle domain events with a post', function (string $eventClass): void {
    $post = Post::factory()->make([
        'id' => (string) Str::uuid(),
    ]);

    $event = new $eventClass($post);

    expect($event)->toBeInstanceOf($eventClass)
        ->and($event->post)->toBe($post);
})->with([
    PostPublished::class,
    PostScheduled::class,
    PostUpdated::class,
    PostUnpublished::class,
    PostDeleted::class,
]);
