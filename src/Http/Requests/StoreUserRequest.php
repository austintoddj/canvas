<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

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
        return [
            'name' => 'required|string',
            'email' => [
                'required',
                'email:filter',
                Rule::unique('canvas_users')->where(function ($query) {
                    return $query->where('email', request('email'));
                })->ignore(request('id'))->whereNull('deleted_at'),
            ],
            'username' => 'nullable|alpha_dash|unique:canvas_users,username,'.request('id'),
            'password' => 'sometimes|nullable|min:8|confirmed',
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
            'name.required' => trans('canvas::app.name_is_required'),
            'name.string' => trans('canvas::app.name_must_be_a_string'),
            'email.required' => trans('canvas::app.email_is_required'),
            'email.email' => trans('canvas::app.email_must_be_valid'),
            'email.unique' => trans('canvas::app.email_has_already_been_taken'),
            'username.alpha_dash' => trans('canvas::app.username_must_only_contain'),
            'username.unique' => trans('canvas::app.username_has_already_been_taken'),
            'password.confirmed' => trans('canvas::app.password_confirmation_does_not_match'),
            'password.min' => trans('canvas::app.password_must_be_at_least_min_characters'),
            'summary.string' => trans('canvas::app.summary_must_be_a_string'),
            'avatar.string' => trans('canvas::app.avatar_must_be_a_string'),
            'dark_mode.boolean' => trans('canvas::app.dark_mode_must_be_true_false'),
            'digest.boolean' => trans('canvas::app.digest_must_be_true_false'),
            'locale.string' => trans('canvas::app.locale_must_be_a_string'),
            'role.integer' => trans('canvas::app.role_must_be_an_integer'),
        ];
    }
}
