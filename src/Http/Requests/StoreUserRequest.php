<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return request()->user('canvas')->isAdmin || request()->user('canvas')->id === $this->route('id');
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
            'name' => 'required|string',
            'email' => [
                'required',
                'email:filter',
                Rule::unique("{$connection}.canvas_users")->where(function (Builder $query) {
                    return $query->where('email', request('email'));
                })->ignore($this->route('id'))->whereNull('deleted_at'),
            ],
            'username' => [
                'nullable',
                'alpha_dash',
                Rule::unique("{$connection}.canvas_users")->where(function (Builder $query) {
                    return $query->where('username', request('username'));
                })->ignore($this->route('id'))->whereNull('deleted_at'),
            ],
            'password' => 'sometimes|required|min:8|confirmed',
            'summary' => 'nullable|string',
            'avatar' => 'nullable|string',
            'dark_mode' => 'nullable|boolean',
            'digest' => 'nullable|boolean',
            'locale' => 'nullable|string',
            'role' => 'nullable|integer',
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
            'name.required' => trans('canvas::app.name_required'),
            'name.string' => trans('canvas::app.name_string'),
            'email.required' => trans('canvas::app.email_required'),
            'email.email' => trans('canvas::app.email_email'),
            'email.unique' => trans('canvas::app.email_unique'),
            'username.alpha_dash' => trans('canvas::app.username_alpha_dash'),
            'username.unique' => trans('canvas::app.username_unique'),
            'password.confirmed' => trans('canvas::app.password_confirmed'),
            'password.min' => trans('canvas::app.password_min'),
            'summary.string' => trans('canvas::app.summary_string'),
            'avatar.string' => trans('canvas::app.avatar_string'),
            'dark_mode.boolean' => trans('canvas::app.dark_mode_boolean'),
            'digest.boolean' => trans('canvas::app.digest_boolean'),
            'locale.string' => trans('canvas::app.locale_string'),
            'role.integer' => trans('canvas::app.role_integer'),
        ];
    }
}
