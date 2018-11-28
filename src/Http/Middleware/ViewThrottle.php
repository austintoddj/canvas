<?php

namespace Canvas\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ViewThrottle
{
    /**
     * Handle the incoming request.
     *
     * @param $request
     * @param $next
     * @return Response
     */
    public function handle(Request $request, Closure $next)
    {
        $posts = $this->getViewedPosts();

        if (! is_null($posts)) {
            $posts = $this->cleanExpiredViews($posts);
            $this->storeInSession($posts);
        }

        return $next($request);
    }

    /**
     * Get the viewed posts stored in the current session.
     *
     * @return array|null
     */
    private function getViewedPosts()
    {
        return session()->get('viewed_posts', null);
    }

    /**
     * Clean out the expired posts from the session.
     *
     * @param array $posts
     * @return array
     */
    private function cleanExpiredViews(array $posts): array
    {
        $time = time();

        $throttleTime = 3600;

        return array_filter($posts, function ($timestamp) use ($time, $throttleTime) {
            return ($timestamp + $throttleTime) > $time;
        });
    }

    /**
     * Store posts in the current session.
     *
     * @param $posts
     * @return void
     */
    private function storeInSession($posts)
    {
        session()->put('viewed_posts', $posts);
    }
}
