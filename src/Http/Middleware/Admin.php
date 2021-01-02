<?php

namespace Canvas\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Admin
{
    /**
     * Handle the incoming request.
     *
     * @param $request
     * @param $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        return request()->user(config('canvas.auth_guard'))->isAdmin ? $next($request) : abort(403);
    }
}
