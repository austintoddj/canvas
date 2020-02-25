<?php

namespace Canvas\Http\Middleware;

use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;

class Session
{
    /**
     * The number of seconds until a view expires.
     *
     * @const int
     */
    private const VIEW_EXPIRES_IN = 3600;

    /**
     * Handle the incoming request.
     *
     * @param $request
     * @param $next
     * @return Response
     */
    public function handle(Request $request, Closure $next)
    {
        $viewedPosts = $this->getViewedPostsInSession();
        $visitedPosts = $this->getVisitedPostsInSession();

        if ($viewedPosts->isNotEmpty()) {
            $this->pruneExpiredViews($viewedPosts);
        }

        if ($visitedPosts->isNotEmpty()) {
            $this->pruneExpiredVisits($visitedPosts);
        }

        return $next($request);
    }

    /**
     * Get the viewed posts in session.
     *
     * @return Collection
     */
    private function getViewedPostsInSession()
    {
        return collect(session()->get('viewed_posts'));
    }

    /**
     * Get the visited posts in session.
     *
     * @return Collection
     */
    private function getVisitedPostsInSession()
    {
        return collect(session()->get('visited_posts'));
    }

    /**
     * Prune expired views from the session.
     *
     * @param Collection $posts
     * @return void
     */
    private function pruneExpiredViews(Collection $posts)
    {
        foreach ($posts as $key => $value) {
            if ($value < now()->subSeconds(self::VIEW_EXPIRES_IN)->timestamp) {
                session()->forget('viewed_posts.'.$key);
            }
        }
    }

    /**
     * Prune expired visits from the session.
     *
     * @param Collection $posts
     * @return void
     */
    private function pruneExpiredVisits(Collection $posts)
    {
        foreach ($posts as $key => $value) {
            if (! Carbon::createFromTimestamp($value['timestamp'])->isToday()) {
                session()->forget('visited_posts.'.$key);
            }
        }
    }
}
