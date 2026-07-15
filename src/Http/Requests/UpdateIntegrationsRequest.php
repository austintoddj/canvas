<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Enums\AiProvider;
use Canvas\Support\Ai;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateIntegrationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::forUser($this->user(config('canvas.guard')))->allows('manage-settings');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'unsplash' => ['sometimes', 'array'],
            'unsplash.access_key' => ['nullable', 'string', 'max:255'],
            'ai' => ['sometimes', 'array'],
            'ai.provider' => ['nullable', 'string', Rule::in(AiProvider::values())],
            'ai.api_key' => ['nullable', 'string', 'max:512'],
            'ai.model' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->has('unsplash') && ! $this->has('ai')) {
                $validator->errors()->add('integrations', 'At least one integration payload is required.');
            }

            if ($this->has('ai') && $this->filled('ai.api_key') && ! $this->filled('ai.provider') && Ai::provider() === null) {
                $validator->errors()->add('ai.provider', 'A provider is required when saving an API key.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('unsplash')) {
            $accessKey = data_get($this->all(), 'unsplash.access_key');

            if ($accessKey === '') {
                $this->merge([
                    'unsplash' => array_merge(
                        (array) $this->input('unsplash', []),
                        ['access_key' => null],
                    ),
                ]);
            }
        }

        if ($this->has('ai')) {
            $ai = (array) $this->input('ai', []);

            if (($ai['api_key'] ?? null) === '') {
                $ai['api_key'] = null;
            }

            if (($ai['model'] ?? null) === '') {
                $ai['model'] = null;
            }

            if (($ai['provider'] ?? null) === '') {
                $ai['provider'] = null;
            }

            $this->merge(['ai' => $ai]);
        }
    }
}
