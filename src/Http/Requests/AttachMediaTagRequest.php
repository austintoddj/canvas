<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Models\MediaTag;
use Illuminate\Support\Facades\Gate;

class AttachMediaTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var MediaTag $tag */
        $tag = $this->route('mediaTag');

        return Gate::forUser($this->user(config('canvas.guard')))->allows('view', $tag);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'media_ids' => ['required', 'array', 'min:1', 'max:50'],
            'media_ids.*' => ['uuid', 'distinct'],
        ];
    }
}
