<?php

namespace Canvas\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Auth\Factory as Auth;
use Illuminate\Http\Request;

class Authenticate
{
    /**
     * The authentication factory instance.
     *
     * @var Auth
     */
    protected $auth;

    /**
     * Create a new middleware instance.
     *
     * @param  Auth  $auth
     */
    public function __construct(Auth $auth)
    {
        $this->auth = $auth;
    }

    /**
     * Handle the incoming request.
     *
     * @param  Request  $request
     * @param  Closure  $next
     * @return mixed
     *
     * @throws AuthenticationException
     */
    public function handle(Request $request, Closure $next)
    {
        if ($this->auth->guard('canvas')->check()) {
            $this->auth->shouldUse('canvas');
        } else {
            throw new AuthenticationException(
                'Unauthenticated.', ['canvas'], route('canvas.login')
            );
        }

        return $next($request);
    }
}
