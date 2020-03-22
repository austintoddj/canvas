<?php

namespace Canvas\Http\Controllers;

use Canvas\Feed;
use Canvas\Post;
use Illuminate\Routing\Controller;

class FeedController extends Controller
{
    /**
     * Return the RSS feed.
     *
     * @return \Illuminate\Contracts\Routing\ResponseFactory|\Illuminate\Http\Response
     */
    public function __invoke()
    {
        $feed = Feed::make()
                    ->as(config('app.name'))
                    ->at(url(config('canvas.feed.path')))
                    ->with(Post::published()->with('user')->get()->toArray())
                    ->on(now()->toDateTimeString())
                    ->get();

        $content = view('canvas::rss.feed', compact('feed'));

        return response($content, 200)->header('Content-Type', 'text/xml');
    }
}
