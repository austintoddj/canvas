<?php

use Canvas\Http\Middleware\Session;
use Canvas\Models\Post;
use Illuminate\Support\Facades\Route;

beforeEach(function (): void {
    Route::middleware([Session::class])->any('/_test/session', function () {
        return true;
    });
});

it('prunes old visits from the session', function (): void {
    $recentPost = Post::factory()->create();
    $oldPost = Post::factory()->create();

    session()->put('visited_posts.'.$recentPost->id, [
        'timestamp' => now()->timestamp,
        'ip' => '127.0.0.1',
    ]);

    session()->put('visited_posts.'.$oldPost->id, [
        'timestamp' => now()->subDay()->timestamp,
        'ip' => '127.0.0.1',
    ]);

    $this->get('/_test/session')->assertSessionHas([
        "visited_posts.{$recentPost->id}",
    ])->assertSessionMissing([
        "visited_posts.{$oldPost->id}",
    ]);
});
it('prunes old views from the session', function (): void {
    $recentPost = Post::factory()->create();
    $oldPost = Post::factory()->create();

    session()->put('viewed_posts.'.$recentPost->id, now()->timestamp);
    session()->put('viewed_posts.'.$oldPost->id, now()->subHours(2)->timestamp);

    $this->get('/_test/session')->assertSessionHas([
        "viewed_posts.{$recentPost->id}",
    ])->assertSessionMissing([
        "viewed_posts.{$oldPost->id}",
    ]);
});
