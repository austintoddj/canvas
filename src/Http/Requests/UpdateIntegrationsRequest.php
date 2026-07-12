<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Illuminate\Support\Facades\Gate;

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
            'unsplash' => ['required', 'array'],
            'unsplash.access_key' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
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
}
