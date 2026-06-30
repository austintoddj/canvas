<?php

declare(strict_types=1);

namespace Canvas\Http\Middleware;

use Canvas\Models\CanvasUser;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EagerLoadCanvasUser
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user(config('canvas.guard'));

        if ($user instanceof Model) {
            $canvasUser = CanvasUser::query()->find($user->getAuthIdentifier());

            if ($canvasUser !== null) {
                $user->setRelation('canvasUser', $canvasUser);
            }
        }

        return $next($request);
    }
}
