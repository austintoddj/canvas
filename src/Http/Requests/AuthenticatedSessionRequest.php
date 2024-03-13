<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthenticatedSessionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $this->redirect = route('canvas.login.view');

        $connection = config('canvas.database_connection');

        return [
            'email' => "required|email:filter|exists:{$connection}.canvas_users",
            'password' => 'required',
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @return void
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate()
    {
        if (! Auth::guard('canvas')->attempt($this->only('email', 'password'), $this->filled('remember_me'))) {
            throw ValidationException::withMessages([
                'email' => trans('canvas::app.these_credentials_do_not_match'),
            ]);
        }
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'email.required' => trans('canvas::app.email_required'),
            'email.email' => trans('canvas::app.email_email'),
            'email.exists' => trans('canvas::app.email_exists'),
            'password.required' => trans('canvas::app.password_required'),
        ];
    }
}
