<?php

declare(strict_types=1);

namespace Canvas\Http\Middleware;

use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;

class ExpireTrafficInSession
{
    /**
     * Handle the incoming request.
     *
     * @param  Request  $request
     * @param  Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $viewedPosts = collect(session()->get('canvas.viewed_posts'));

        if ($viewedPosts->isNotEmpty()) {
            $viewedPosts->each(function ($timestamp, $id) {
                // A post is tracked as "viewed" once per hour...
                if ($timestamp < now()->subSeconds(3600)->timestamp) {
                    session()->forget("canvas.viewed_posts.{$id}");
                }
            });
        }

        $visitedPosts = collect(session()->get('canvas.visited_posts'));

        if ($visitedPosts->isNotEmpty()) {
            $visitedPosts->each(function ($item, $id) {
                // A post is tracked as "visited" once per day...
                if (! Carbon::createFromTimestamp($item['timestamp'])->isToday()) {
                    session()->forget("canvas.visited_posts.{$id}");
                }
            });
        }

        return $next($request);
    }
}
