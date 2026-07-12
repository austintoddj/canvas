<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

class UserLookupRequest extends FormRequest
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
            'q' => ['required', 'string', 'max:255'],
        ];
    }

    public function identifier(): string
    {
        return trim((string) $this->validated('q'));
    }
}
