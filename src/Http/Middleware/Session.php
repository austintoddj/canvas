<?php

declare(strict_types=1);

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
     * @return Response
     */
    public function handle(Request $request, Closure $next)
    {
        if (session()->has('viewed_posts')) {
            $stale = collect(session()->get('viewed_posts'))
                ->filter(fn ($timestamp) => $timestamp < now()->subHour()->timestamp)
                ->keys()
                ->map(fn ($id) => "viewed_posts.{$id}")
                ->all();

            session()->forget($stale);
        }

        if (session()->has('visited_posts')) {
            $stale = collect(session()->get('visited_posts'))
                ->filter(fn ($item) => ! Date::createFromTimestamp($item['timestamp'])->isToday())
                ->keys()
                ->map(fn ($id) => "visited_posts.{$id}")
                ->all();

            session()->forget($stale);
        }

        return $next($request);
    }
}
