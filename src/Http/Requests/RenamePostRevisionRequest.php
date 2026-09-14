<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

class RenamePostRevisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'label' => ['nullable', 'string', 'max:120'],
        ];
    }
}
