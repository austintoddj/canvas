<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Models\Media;
use Illuminate\Support\Facades\Gate;

class DestroyMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Media $media */
        $media = $this->route('media');

        return Gate::forUser($this->user(config('canvas.guard')))->allows('delete', $media);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
