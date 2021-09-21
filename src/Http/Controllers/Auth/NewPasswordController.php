<?php

namespace Canvas\Http\Controllers\Auth;

use Canvas\Models\User;
use Exception;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Throwable;

class NewPasswordController extends Controller
{
    /**
     * Display the password reset view.
     *
     * @param  Request  $request
     * @return Application|Factory|View
     */
    public function create(Request $request)
    {
        return view('canvas::auth.passwords.reset')->with([
            'request' => $request,
        ]
        );
    }

    /**
     * Handle an incoming new password request.
     *
     * @param  Request  $request
     * @return RedirectResponse
     *
     * @throws Exception
     */
    public function store(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8',
        ]);

        try {
            [$id, $token] = explode('|', decrypt($request->token));

            $user = User::findOrFail($id);

            // Here we will attempt to reset the user's password. If it is successful we
            // will update the password on an actual user model and persist it to the
            // database. Otherwise we will parse the error and return the response.
            $user->password = Hash::make($request->password);

            $user->setRememberToken(Str::random(60));

            $user->save();

            Auth::guard('canvas')->login($user);
        } catch (Throwable $e) {
            return redirect()->route('canvas.password.request')->with('invalidResetToken', 'Invalid token');
        }

        cache()->forget("password.reset.{$id}");

        // If the password was successfully reset, we will redirect the user back to
        // the application's home authenticated view. If there is an error we can
        // redirect them back to where they came from with their error message.
        return redirect()->route('canvas');
    }
}
