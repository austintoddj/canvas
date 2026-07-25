<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Support\UploadLimits;

class StoreMediaRequest extends FormRequest
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
            'file' => [
                'required',
                'file',
                'mimes:jpg,jpeg,gif,png,webp',
                'max:'.UploadLimits::maxKilobytes(),
            ],
            'alt' => ['nullable', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:255'],
            'original_name' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.max' => UploadLimits::tooLargeMessage(locale: UploadLimits::requestLocale($this)),
        ];
    }
}
