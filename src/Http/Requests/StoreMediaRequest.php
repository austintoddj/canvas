<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

class StoreMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'mimes:jpg,jpeg,gif,png,webp',
                'max:'.((int) config('canvas.upload_filesize') / 1024),
            ],
            'alt' => ['nullable', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:255'],
            'original_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
