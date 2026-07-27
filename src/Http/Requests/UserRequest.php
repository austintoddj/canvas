<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Enums\Role;
use Canvas\Support\Localization;
use Canvas\Support\MediaUrl;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    /**
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

        if ($this->has('avatar') && is_string($this->input('avatar')) && $this->input('avatar') !== '') {
            $normalized['avatar'] = MediaUrl::toStoredMediaReference($this->input('avatar'));
        }

        if ($normalized !== []) {
            $this->merge($normalized);
        }
    }

    /**
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
            'avatar' => [
                'nullable',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_string($value) || $value === '') {
                        return;
                    }

                    if (MediaUrl::isPublicStorageReference($value)) {
                        return;
                    }

                    if (filter_var($value, FILTER_VALIDATE_URL) !== false) {
                        return;
                    }

                    $fail(__('validation.url', ['attribute' => $attribute]));
                },
            ],
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
            'role' => ['nullable', 'integer', Rule::in(Role::values())],
        ];
    }
}
