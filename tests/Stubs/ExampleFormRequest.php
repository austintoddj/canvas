<?php

declare(strict_types=1);

namespace Canvas\Tests\Stubs;

use Canvas\Http\Requests\FormRequest;

class ExampleFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string',
            'social' => 'nullable|array',
            'social.*' => 'nullable|string|max:255',
        ];
    }
}
