<?php

namespace Canvas\Http\Controllers;

use Canvas\Post;
use Illuminate\View\View;
use Illuminate\Routing\Controller;

class StatsController extends Controller
{
    /**
     * Show the overall stats dashboard.
     *
     * @return View
     */
    public function index(): View
    {
        $posts = Post::paginate(10);

        $data = [
            'posts' => [
                'all'       => $posts,
                'published' => $posts->where('published_at', '<=', now()->toDateTimeString()),
                'drafts'    => $posts->where('published_at', '>', now()->toDateTimeString()),
            ],
        ];

        return view('canvas::canvas.stats.index', compact('data'));
    }

    /**
     * Display stats for a single post.
     *
     * @param string $id
     * @return View
     */
    public function show(string $id): View
    {
        $post = Post::findOrFail($id);

        if ($post->published) {
            $data = [
                'post' => $post,
            ];

            return view('canvas::canvas.stats.show', compact('data'));
        } else {
            abort(404);
        }
    }
}
