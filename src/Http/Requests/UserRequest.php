<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Enums\Role;
use Canvas\Support\Localization;
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

    protected function prepareForValidation(): void
    {
        $normalized = [];

        foreach (['username', 'summary', 'avatar', 'website', 'locale', 'timezone'] as $field) {
            if ($this->has($field) && $this->input($field) === '') {
                $normalized[$field] = null;
            }
        }

        if ($normalized !== []) {
            $this->merge($normalized);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'username' => [
                'nullable',
                'alpha_dash',
                'max:255',
                Rule::unique('canvas_users', 'username')->ignore($this->route('id'), 'user_id'),
            ],
            'summary' => 'nullable|string|max:5000',
            'avatar' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'social' => 'nullable|array',
            'social.*' => 'nullable|string|max:255',
            'locale' => [
                'nullable',
                'string',
                Rule::in(Localization::availableLanguageCodes()),
            ],
            'timezone' => 'nullable|timezone:all',
            'theme' => 'nullable|in:system,light,dark',
            'digest' => 'nullable|bool',
            'preferences' => 'nullable|array',
            'preferences.onboarding' => 'nullable|array',
            'preferences.onboarding.complete' => 'nullable|bool',
            'role' => ['nullable', 'integer', Rule::in(Role::values())],
        ];
    }
}
