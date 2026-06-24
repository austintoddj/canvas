<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Services\StatsAggregator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

class StatsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function __invoke(): JsonResponse
    {
        $user = request()->user(config('canvas.guard'));
        $canViewAllPosts = Gate::forUser($user)->allows('viewAll', Post::class);

        $posts = Post::query()
            ->when(request()->query('scope', 'user') === 'all' && $canViewAllPosts, function (Builder $query) {
                return $query;
            }, function (Builder $query) use ($user) {
                return $query->where('user_id', $user->id);
            })
            ->withCount('views', 'visits')
            ->published()
            ->latest()
            ->get();

        $stats = new StatsAggregator($user);

        $results = $stats->getStatsForPosts($posts, 30);

        return response()->json($results);
    }
}
