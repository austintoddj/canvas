<?php

namespace App\Http\Controllers\Auth;

use Auth;
use Session;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PasswordController extends Controller
{
    /**
     * Create a new password controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * @param Request $request
     * @return $this|\Illuminate\Http\RedirectResponse
     */
    public function updatePassword(Request $request)
    {
        $this->validate($request, [
            'password'     => 'required',
            'new_password' => 'required|confirmed|min:6',
        ]);

        $guard = Auth::guard();

        if (! $guard->validate($request->only('password'))) {
            return back()->withErrors(trans('auth.failed'));
        }

        $user = $guard->user();
        $user->password = bcrypt($request->input('new_password'));
        $user->save();

        Session::set('_passwordUpdate', trans('messages.update_success', ['entity' => 'Your password']));

        return back();
    }
}
