<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Services\StatsAggregator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class StatsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function __invoke(): JsonResponse
    {
        $posts = Post::query()
            ->when(request()->query('scope', 'user') === 'all', function (Builder $query) {
                return $query;
            }, function (Builder $query) {
                return $query->where('user_id', request()->user('canvas')->id);
            })
            ->withCount('views', 'visits')
            ->published()
            ->latest()
            ->get();

        $stats = new StatsAggregator(request()->user('canvas'));

        $results = $stats->getStatsForPosts($posts, 30);

        return response()->json($results);
    }
}
