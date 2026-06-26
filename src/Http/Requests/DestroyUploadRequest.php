<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Support\Paths;

class DestroyUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'path' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! str_starts_with($value, Paths::baseStoragePath())) {
                        $fail('The :attribute does not point to a valid upload location.');
                    }
                },
            ],
        ];
    }
}
