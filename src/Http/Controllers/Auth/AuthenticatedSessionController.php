<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers\Auth;

use Canvas\Http\Requests\AuthenticatedSessionRequest;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function create()
    {
        if (Auth::guard('canvas')->check()) {
            return redirect()->route('canvas');
        }

        return view('canvas::auth.login');
    }

    /**
     * Handle an incoming authentication request.
     *
     * <<<<<<< HEAD
     *
     * @param  AuthenticatedSessionRequest  $request
     * @param  LoginRequest  $request
     * @return \Illuminate\Http\RedirectResponse
     *                                           =======
     * @return RedirectResponse
     *                          >>>>>>> develop
     *
     * @throws ValidationException
     */
    public function store(AuthenticatedSessionRequest $request)
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->route('canvas');
    }

    /**
     * Destroy an authenticated session.
     *
     * @param  Request  $request
     *                            <<<<<<< HEAD
     * @return \Illuminate\Http\RedirectResponse
     *                                           =======
     * @return RedirectResponse
     *                          >>>>>>> develop
     */
    public function destroy(Request $request)
    {
        Auth::guard('canvas')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('canvas.login');
    }
}
