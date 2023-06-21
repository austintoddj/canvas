<?php

namespace Canvas\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Admin
{
    /**
     * Handle the incoming request.
     *
     * @param  $request
     * @param  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        return $request->user('canvas')->isAdmin ? $next($request) : abort(403);
    }
}
