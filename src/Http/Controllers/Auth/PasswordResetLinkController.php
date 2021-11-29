<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers\Auth;

use Canvas\Http\Requests\PasswordResetLinkRequest;
use Canvas\Mail\ResetPassword;
use Canvas\Models\User;
use Exception;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     *
     * @return Application|Factory|View
     */
    public function create()
    {
        return view('canvas::auth.passwords.email');
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @param  PasswordResetLinkRequest  $request
     * @return RedirectResponse
     *
     * @throws Exception
     */
    public function store(PasswordResetLinkRequest $request)
    {
        $data = $request->validated();

        $user = User::firstWhere('email', $data['email']);

        $token = Str::random();

        if ($user) {
            cache(["password.reset.{$user->id}" => $token],
                now()->addMinutes(60)
            );

            // We will send the password reset link to this user. Once we have attempted
            // to send the link, we will examine the response then see the message we
            // need to show to the user. Finally, we'll send out a proper response.
            Mail::to($user->email)->send(new ResetPassword(encrypt("{$user->id}|{$token}")));
        }

        return redirect()
            ->route('canvas.forgot-password.view')
            ->with('status', trans('passwords.sent', [], app()->getLocale()));
    }
}
