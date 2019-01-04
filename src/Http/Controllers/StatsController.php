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
        $posts = Post::with('views')->orderByDesc('created_at')->paginate(10);
        $views = \Canvas\View::all();

        $data = [
            'posts' => [
                'all'       => $posts,
                'published' => $posts->where('published_at', '<=', now()->toDateTimeString()),
                'drafts'    => $posts->where('published_at', '>', now()->toDateTimeString()),
            ],
            'views' => [
                'count' => $this->suffixed_number($views->count()),
                'trend' => json_encode(\Canvas\View::viewTrend($views)),
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
        $post = Post::with('views')->findOrFail($id);

        if ($post->published) {
            $data = [
                'post'                  => $post,
                'traffic'               => $post->topReferers,
                'popular_reading_times' => $post->popularReadingTimes,
                'views'                 => json_encode($post->viewTrend),
            ];

            return view('canvas::canvas.stats.show', compact('data'));
        } else {
            abort(404);
        }
    }

    /**
     * Return a number format with a suffix.
     *
     * @param int $n
     * @param int $precision
     * @return string
     */
    private function suffixed_number(int $n, $precision = 1): string
    {
        if ($n < 900) {
            $n_format = number_format($n, $precision);
            $suffix = '';
        } elseif ($n < 900000) {
            $n_format = number_format($n / 1000, $precision);
            $suffix = 'K';
        } elseif ($n < 900000000) {
            $n_format = number_format($n / 1000000, $precision);
            $suffix = 'M';
        } elseif ($n < 900000000000) {
            $n_format = number_format($n / 1000000000, $precision);
            $suffix = 'B';
        } else {
            $n_format = number_format($n / 1000000000000, $precision);
            $suffix = 'T';
        }

        if ($precision > 0) {
            $dot_zero = '.'.str_repeat('0', $precision);
            $n_format = str_replace($dot_zero, '', $n_format);
        }

        return $n_format.$suffix;
    }
}
