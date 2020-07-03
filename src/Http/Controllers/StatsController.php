<?php

namespace Canvas\Http\Controllers;

use Canvas\Helpers\Traffic;
use Canvas\Models\Post;
use Canvas\Models\View;
use Canvas\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class StatsController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $posts = Post::forUser(request()->user())
                     ->published()
                     ->latest()
                     ->get();

        $views = View::select('created_at')
                     ->forPostsInRange(
                         $posts->pluck('id'),
                         today()->subDays(30)->startOfDay()->toDateTimeString(),
                         today()->endOfDay()->toDateTimeString()
                     )->get();

        $visits = Visit::select('created_at')
                       ->forPostsInRange(
                           $posts->pluck('id'),
                           today()->subDays(30)->startOfDay()->toDateTimeString(),
                           today()->endOfDay()->toDateTimeString()
                       )->get();

        return response()->json([
            'posts' => $posts,
            'total_views' => $views->count(),
            'total_visits' => $visits->count(),
            'traffic' => [
                'views' => json_encode(Traffic::calculateTotalForDays($views, 30)),
                'visits' => json_encode(Traffic::calculateTotalForDays($visits, 30)),
            ],
        ]);
    }

    /**
     * Display the specified resource.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        $post = Post::forUser(request()->user())->find($id);

        if (! $post || ! $post->published) {
            return response()->json(null, 404);
        }

        $views = View::where('post_id', $post->id)->get();
        $previousMonthlyViews = $views->whereBetween('created_at', [
            today()->subMonth()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonth()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);
        $currentMonthlyViews = $views->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);
        $lastThirtyDays = $views->whereBetween('created_at', [
            today()->subDays(30)->startOfDay()->toDateTimeString(),
            today()->endOfDay()->toDateTimeString(),
        ]);

        $visits = Visit::where('post_id', $post->id)->get();
        $previousMonthlyVisits = $visits->whereBetween('created_at', [
            today()->subMonth()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->subMonth()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);
        $currentMonthlyVisits = $visits->whereBetween('created_at', [
            today()->startOfMonth()->startOfDay()->toDateTimeString(),
            today()->endOfMonth()->endOfDay()->toDateTimeString(),
        ]);

        return response()->json([
            'post' => $post,
            'read_time' => $post->read_time,
            'popular_reading_times' => $post->popular_reading_times,
            'top_referers' => $post->top_referers,
            'monthly_views' => $currentMonthlyViews->count(),
            'total_views' => $views->count(),
            'monthly_visits' => $currentMonthlyVisits->count(),
            'month_over_month_views' => Traffic::compareMonthOverMonth($currentMonthlyViews, $previousMonthlyViews),
            'month_over_month_visits' => Traffic::compareMonthOverMonth($currentMonthlyVisits, $previousMonthlyVisits),
            'traffic' => [
                'views' => json_encode(Traffic::calculateTotalForDays($lastThirtyDays, 30)),
                'visits' => json_encode(Traffic::calculateTotalForDays($visits, 30)),
            ],
        ]);
    }
}
