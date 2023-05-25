<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PasswordResetLinkRequest extends FormRequest
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
            'email' => "required|email:filter|exists:{$connection}.canvas_users",
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
            'email.required' => trans('canvas::app.email_required'),
            'email.email' => trans('canvas::app.email_email'),
            'email.exists' => trans('canvas::app.email_exists'),
        ];
    }
}
