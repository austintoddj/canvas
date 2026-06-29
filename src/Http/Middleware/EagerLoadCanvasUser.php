<?php

declare(strict_types=1);

namespace Canvas\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EagerLoadCanvasUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user(config('canvas.guard'));

        if ($user !== null && method_exists($user, 'canvasUser')) {
            $user->loadMissing('canvasUser');
        }

        return $next($request);
    }
}
