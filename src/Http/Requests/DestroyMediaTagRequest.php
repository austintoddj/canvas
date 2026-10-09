<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Models\MediaTag;
use Illuminate\Support\Facades\Gate;

class DestroyMediaTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var MediaTag $tag */
        $tag = $this->route('mediaTag');

        return Gate::forUser($this->user(config('canvas.guard')))->allows('delete', $tag);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
