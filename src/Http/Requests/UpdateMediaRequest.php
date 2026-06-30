<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Models\Media;
use Illuminate\Support\Facades\Gate;

class UpdateMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Media $media */
        $media = $this->route('media');

        return Gate::forUser($this->user(config('canvas.guard')))->allows('update', $media);
    }

    public function rules(): array
    {
        return [
            'alt' => ['nullable', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:255'],
            'original_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
