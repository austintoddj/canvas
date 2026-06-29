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
        $user = $request->user(config('canvas.guard'));

        if ($user === null) {
            abort(403);
        }

        if (method_exists($user, 'canvasUser')) {
            if ($user->canvasUser === null) {
                abort(403);
            }

            return $next($request);
        }

        if (! CanvasUser::query()->where('user_id', $user->getAuthIdentifier())->exists()) {
            abort(403);
        }

        return $next($request);
    }
}
