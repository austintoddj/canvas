<?php

declare(strict_types=1);

namespace Canvas\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifyAdmin
{
    /**
     * Handle the incoming request.
     *
     * @param  Request  $request
     * @param  Closure  $next
     * @return mixed|void
     */
    public function handle(Request $request, Closure $next)
    {
        return $request->user('canvas')->isAdmin ? $next($request) : abort(403);
    }
}
