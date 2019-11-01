<?php

namespace Canvas\Http\Controllers;

use Canvas\Post;
use Canvas\Trends;
use Canvas\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class StatsController extends Controller
{
    use Trends;

    /**
     * Number of days to compile stats.
     *
     * @const int
     */
    private const DAYS_PRIOR = 30;

    /**
     * Get all the stats.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $published = Post::published()
            ->orderByDesc('created_at')
            ->withCount('views')
            ->get();

        // Append the estimated reading time
        $published->each->append('read_time');

        // Get views for the last [X] days
        $views = View::select('created_at')
            ->whereBetween('created_at', [
                today()->subDays(self::DAYS_PRIOR)->toDateTimeString(),
                today()->toDateTimeString(),
            ])->get();

        return response()->json([
            'posts' => [
                'all'             => $published,
                'published_count' => $published->count(),
                'drafts_count'    => Post::draft()->count(),
            ],
            'views' => [
                'count' => $views->count(),
                'trend' => json_encode($this->getViewCounts($views, self::DAYS_PRIOR)),
            ],
        ]);
    }

    /**
     * Get stats for a single post.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        $post = Post::find($id);

        if ($post && $post->published) {
            return response()->json([
                'post'                  => $post,
                'traffic'               => $post->top_referers,
                'popular_reading_times' => $post->popular_reading_times,
                'views'                 => json_encode($this->getViewCounts($post->views, self::DAYS_PRIOR)),
            ]);
        } else {
            return response()->json(null, 301);
        }
    }
}
