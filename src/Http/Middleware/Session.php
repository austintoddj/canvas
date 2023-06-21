<?php

namespace Canvas\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Date;

class Session
{
    /**
     * Handle the incoming request.
     *
     * @param  $request
     * @param  $next
     * @return Response
     */
    public function handle(Request $request, Closure $next)
    {
        $viewedPosts = collect(session()->get('viewed_posts'));
        $visitedPosts = collect(session()->get('visited_posts'));

        if ($viewedPosts->isNotEmpty()) {
            $viewedPosts->each(function ($timestamp, $id) {
                if ($timestamp < now()->subSeconds(3600)->timestamp) {
                    session()->forget("viewed_posts.{$id}");
                }
            });
        }

        if ($visitedPosts->isNotEmpty()) {
            $visitedPosts->each(function ($item, $id) {
                if (! Date::createFromTimestamp($item['timestamp'])->isToday()) {
                    session()->forget("visited_posts.{$id}");
                }
            });
        }

        return $next($request);
    }
}
