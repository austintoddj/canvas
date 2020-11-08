<?php

namespace Canvas\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
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
        return [
            'name' => 'required|string',
            'email' => [
                'required',
                'email',
                Rule::unique('canvas_users')->where(function ($query) {
                    return $query->where('email', request('email'));
                })->ignore(request('id'))->whereNull('deleted_at'),
            ],
            'username' => 'nullable|alpha_dash|unique:canvas_users,username,'.request('id'),
            'password' => 'sometimes|nullable|min:8|confirmed',
            'summary' => 'nullable|string',
            'avatar' => 'nullable|string',
            'dark_mode' => 'nullable|bool',
            'digest' => 'nullable|bool',
            'locale' => 'nullable|string',
            'role' => 'nullable|integer',
        ];
    }
}
