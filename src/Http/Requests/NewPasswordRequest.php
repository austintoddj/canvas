<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NewPasswordRequest extends FormRequest
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
        $connection = config('canvas.database_connection');

        return [
            'token' => 'required',
            'email' => "required|email:filter|exists:{$connection}.canvas_users",
            'password' => 'required|confirmed|min:8',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'token.required' => trans('canvas::app.token_required'),
            'email.required' => trans('canvas::app.email_required'),
            'password.required' => trans('canvas::app.password_required'),
            'password.confirmed' => trans('canvas::app.password_confirmed'),
            'password.min' => trans('canvas::app.password_min'),
        ];
    }
}
