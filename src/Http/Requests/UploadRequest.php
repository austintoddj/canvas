<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

class UploadRequest extends FormRequest
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
        ];
    }
}
