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

    private function normalizeApiKey(string $value): ?string
    {
        $key = trim($value);

        if ($key === '') {
            return null;
        }

        if (preg_match('/^Bearer\s+/i', $key) === 1) {
            $key = trim((string) preg_replace('/^Bearer\s+/i', '', $key));
        }

        return $key === '' ? null : $key;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('unsplash')) {
            $accessKey = data_get($this->all(), 'unsplash.access_key');

            if (is_string($accessKey)) {
                $accessKey = trim($accessKey);
            }

            if ($accessKey === '' || $accessKey === null) {
                $this->merge([
                    'unsplash' => array_merge(
                        (array) $this->input('unsplash', []),
                        ['access_key' => null],
                    ),
                ]);
            } elseif (is_string($accessKey)) {
                $this->merge([
                    'unsplash' => array_merge(
                        (array) $this->input('unsplash', []),
                        ['access_key' => $accessKey],
                    ),
                ]);
            }
        }

        if ($this->has('ai')) {
            $ai = (array) $this->input('ai', []);

            if (array_key_exists('api_key', $ai)) {
                $apiKey = $ai['api_key'];
                if (is_string($apiKey)) {
                    $ai['api_key'] = $this->normalizeApiKey($apiKey);
                } elseif ($apiKey === null) {
                    $ai['api_key'] = null;
                }
            }

            if (array_key_exists('model', $ai)) {
                $model = $ai['model'];
                if (is_string($model)) {
                    $trimmed = trim($model);
                    $ai['model'] = $trimmed === '' ? null : $trimmed;
                } elseif ($model === null) {
                    $ai['model'] = null;
                }
            }

            if (array_key_exists('provider', $ai)) {
                $provider = $ai['provider'];
                if (is_string($provider) && trim($provider) === '') {
                    $ai['provider'] = null;
                }
            }

            $this->merge(['ai' => $ai]);
        }
    }
}
