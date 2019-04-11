<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\View;
use Illuminate\Routing\Controller;

class StatsController extends Controller
{
    /**
     * Days in the past to generate statistics for.
     *
     * @const int
     */
    private const DAYS_PRIOR = 30;

    /**
     * Get all of the posts and views.
     *
     * @return \Illuminate\View\View
     */
    public function index()
    {
        // Get all of the posts
        $posts = Post::orderByDesc('created_at')
            ->select('id', 'title', 'body', 'published_at', 'created_at')
            ->withCount('views')
            ->get();

        // Filter out posts that are not published
        $postList = $posts->filter(function ($value, $key) {
            return $value->published;
        });

        // Append the reading time attribute
        $postList->each->append('read_time');

        // Get views for the last [X] days
        $views = View::whereBetween('created_at', [
            now()->subDays(self::DAYS_PRIOR)->toDateTimeString(),
            now()->toDateTimeString(),
        ])->select('created_at')->get();

        $data = [
            'posts' => [
                'all'             => $posts,
                'published_count' => $posts->where('published_at', '<=', now()->toDateTimeString())->count(),
                'drafts_count'    => $posts->where('published_at', '>', now()->toDateTimeString())->count(),
            ],
            'views' => [
                'count' => $views->count(),
                'trend' => json_encode(View::viewTrend($views, self::DAYS_PRIOR)),
            ],
        ];

        return view('canvas::stats.index', compact('data'));
    }

    /**
     * Get the statistics for a given post.
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
                'traffic'               => $post->top_referers,
                'popular_reading_times' => $post->popular_reading_times,
                'views'                 => json_encode($post->view_trend),
            ];

            return view('canvas::stats.show', compact('data'));
        } else {
            abort(404);
        }
    }
}
