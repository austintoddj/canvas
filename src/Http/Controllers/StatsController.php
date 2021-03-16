<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Services\StatsAggregator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

final class StatsController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $posts = Post::query()
                     ->when(request()->query('scope', 'user') === 'all', function (Builder $query) {
                         return $query;
                     }, function (Builder $query) {
                         return $query->where('user_id', request()->user('canvas')->id);
                     })
                     ->published()
                     ->latest()
                     ->with('views', 'visits')
                     ->get();

        $service = new StatsAggregator();

        return response()->json($service->getStatsForPosts($posts));
    }
}
