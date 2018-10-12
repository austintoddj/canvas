<?php

namespace Canvas\Http\Middleware;

use Canvas\Canvas;

class Authenticate
{
    /**
     * Handle the incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Illuminate\Http\Response|null
     */
    public function handle($request, $next)
    {
        return Canvas::check($request) ? $next($request) : abort(403);
    }
}
