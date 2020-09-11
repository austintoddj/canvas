<?php

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
        return $this->user('canvas')->isAdmin;
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
                'email',
                Rule::unique('canvas_users')->where(function ($query) {
                    return $query->where('email', request('email'));
                })->ignore(request('id'))->whereNull('deleted_at'),
            ],
            'username' => 'nullable|alpha_dash|unique:canvas_users,username,'.request()->user('canvas')->id,
            'password' => 'sometimes|nullable|min:8',
            'summary' => 'nullable|string',
            'avatar' => 'nullable|string',
            'dark_mode' => 'nullable|bool',
            'digest' => 'nullable|bool',
            'local' => 'nullable|string',
            'role' => 'nullable|integer',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'required' => trans('canvas::app.validation_required', [], optional(request()->user('canvas'))->locale),
            'unique' => trans('canvas::app.validation_unique', [], optional(request()->user('canvas'))->locale),
        ];
    }
}
