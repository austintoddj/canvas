<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Enums\AiWritingAction;
use Illuminate\Validation\Rule;

class AiRewriteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user(config('canvas.guard')) !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'action' => ['required', 'string', Rule::in(AiWritingAction::values())],
            'text' => ['required', 'string', 'min:1', 'max:8000'],
            'instruction' => [
                'nullable',
                'string',
                'max:1000',
                Rule::requiredIf(fn (): bool => $this->input('action') === AiWritingAction::Custom->value),
            ],
            'title' => ['nullable', 'string', 'max:255'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $instruction = $this->input('instruction');

        if ($instruction === '') {
            $this->merge(['instruction' => null]);
        }

        $title = $this->input('title');

        if ($title === '') {
            $this->merge(['title' => null]);
        }
    }
}
