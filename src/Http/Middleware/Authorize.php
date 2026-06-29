<?php

declare(strict_types=1);

namespace Canvas\Http\Middleware;

use Canvas\Models\CanvasUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Authorize
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! CanvasUser::query()->where('user_id', $request->user()->getAuthIdentifier())->exists()) {
            abort(403);
        }

        return $next($request);
    }
}
