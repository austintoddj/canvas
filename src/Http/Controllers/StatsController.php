<?php

namespace Canvas\Http\Controllers;

use Canvas\Post;
use Canvas\View;
use Illuminate\Routing\Controller;

class StatsController extends Controller
{
    const DAYS_PRIOR = 30;

    /**
     * Show the overall statistics for all posts.
     *
     * @return \Illuminate\View\View
     */
    public function index()
    {
        $posts = Post::withCount('views')->orderByDesc('created_at')->paginate();
        $views = View::whereBetween('created_at', [
            now()->subDays(self::DAYS_PRIOR)->toDateTimeString(),
            now()->toDateTimeString(),
        ])->select('created_at')->get();

        $data = [
            'posts' => [
                'all'       => $posts,
                'published' => $posts->where('published_at', '<=', now()->toDateTimeString()),
                'drafts'    => $posts->where('published_at', '>', now()->toDateTimeString()),
            ],
            'views' => [
                'count' => $views->count(),
                'trend' => json_encode(View::viewTrend($views, self::DAYS_PRIOR)),
            ],
        ];

        return view('canvas::stats.index', compact('data'));
    }

    /**
     * Show data analytics for a single post.
     *
     * @param string $id
     * @return \Illuminate\View\View
     */
    public function show(string $id)
    {
        $post = Post::findOrFail($id);

        if ($post->published) {
            $data = [
                'post'                  => $post,
                'traffic'               => $post->topReferers,
                'popular_reading_times' => $post->popularReadingTimes,
                'views'                 => json_encode($post->viewTrend),
            ];

            return view('canvas::stats.show', compact('data'));
        } else {
            abort(404);
        }
    }
}
