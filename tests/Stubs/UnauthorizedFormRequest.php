<?php

declare(strict_types=1);

namespace Canvas\Tests\Stubs;

use Canvas\Http\Requests\FormRequest;

class UnauthorizedFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return false;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string',
        ];
    }
}
