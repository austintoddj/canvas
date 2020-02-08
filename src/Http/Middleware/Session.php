<?php

namespace Canvas\Http\Middleware;

use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class Session
{
    /**
     * The number of seconds until a view expires.
     *
     * @const int
     */
    private const EXPIRES_IN = 3600;

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

        if (! is_null($viewedPosts)) {
            $this->pruneExpiredViews($viewedPosts);
        }

        if (! is_null($visitedPosts)) {
            $this->pruneExpiredVisits($visitedPosts);
        }

        return $next($request);
    }

    /**
     * Get the viewed posts in session.
     *
     * @return array|null
     */
    private function getViewedPostsInSession()
    {
        return session()->get('viewed_posts', null);
    }

    /**
     * Get the visited posts in session.
     *
     * @return array|null
     */
    private function getVisitedPostsInSession()
    {
        return session()->get('visited_posts', null);
    }

    /**
     * Prune expired posts from the session.
     *
     * @param array $posts
     * @return void
     */
    private function pruneExpiredViews(array $posts)
    {
        foreach (collect($posts) as $key => $value) {
            if ($value < now()->subSeconds(self::EXPIRES_IN)->timestamp) {
                session()->forget('viewed_posts.'.$key);
            }
        }
    }

    /**
     * Prune expired posts from the session.
     *
     * @param array $posts
     * @return void
     */
    private function pruneExpiredVisits(array $posts)
    {
        foreach (collect($posts) as $key => $value) {
            if (! Carbon::createFromTimestamp($value['timestamp'])->isToday()) {
                session()->forget('visited_posts.'.$key);
            }
        }
    }
}
