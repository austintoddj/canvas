<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class FeedController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $posts = Post::query()
            ->select('id', 'slug', 'title', 'user_id', 'summary', 'published_at')
            ->latest()
            ->published()
            ->with('user')
            ->get();

        return response()->view('canvas::feed', compact('posts'))->header('Content-Type', 'text/xml');
    }
}
