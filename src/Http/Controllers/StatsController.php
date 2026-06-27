<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Analytics\DashboardInsights;
use Canvas\Models\Post;
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

        $postIds = Post::query()
            ->when(request()->query('scope', 'user') === 'all' && $canViewAllPosts, function (Builder $query) {
                return $query;
            }, function (Builder $query) use ($user) {
                return $query->where('user_id', $user->id);
            })
            ->published()
            ->latest()
            ->pluck('id');

        return response()->json(DashboardInsights::for($postIds, 30));
    }
}
