<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers\Auth;

use Canvas\Http\Requests\NewPasswordRequest;
use Canvas\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class NewPasswordController extends Controller
{
    /**
     * Display the password reset view.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\View\View
     */
    public function create(Request $request)
    {
        return view('canvas::auth.passwords.reset')
            ->with(['request' => $request]);
    }

    /**
     * Handle an incoming new password request.
     *
     * @param  \Canvas\Http\Requests\NewPasswordRequest  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(NewPasswordRequest $request)
    {
        $data = $request->validated();

        [$id, $token] = explode('|', decrypt($data['token']));

        $user = User::query()->firstWhere('id', $id);

        $key = "password.reset.{$user->id}";

        if (! Cache::get($key)) {
            return redirect()
                ->route('canvas.reset-password.view', [
                    'token' => $token,
                ])->with('invalidResetToken', trans('canvas::app.this_password_reset_token_is_invalid', [], app()->getLocale()));
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
            'remember_token' => Str::random(60),
        ])->save();

        Auth::guard('canvas')->login($user);

        Cache::forget($key);

        return redirect()->route('canvas');
    }
}
