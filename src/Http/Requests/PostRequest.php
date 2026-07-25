<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Models\Post;
use Canvas\Support\MediaUrl;
use Illuminate\Validation\Rule;

class PostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('featured_image')) {
            return;
        }

        $this->merge([
            'featured_image' => MediaUrl::toStoredMediaReference(
                is_string($this->input('featured_image')) ? $this->input('featured_image') : null,
            ),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->user(config('canvas.guard'));
        $postId = $this->route('id');
        $post = is_string($postId) ? Post::query()->find($postId) : null;
        $ownerId = $post instanceof Post ? $post->user_id : data_get($user, 'id');

        // Drafts may be created or updated without a title; lists show “Untitled post”.
        // Publishing still requires a title (promote + published_at).
        $titleRules = ['nullable', 'string'];

        if (filled($this->input('published_at')) && $this->boolean('promote')) {
            $titleRules = ['required', 'string'];
        }

        return [
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_posts')->where(function ($query) use ($ownerId) {
                    return $query->where('slug', $this->input('slug'))->where('user_id', $ownerId);
                })->ignore(is_string($postId) ? $postId : null)->whereNull('deleted_at'),
            ],
            'title' => $titleRules,
            'summary' => 'nullable|string',
            'body' => 'nullable|string',
            'published_at' => 'nullable|date',
            'featured_image' => 'nullable|string',
            'featured_image_caption' => 'nullable|string',
            'meta' => 'nullable|array',
            'promote' => 'sometimes|boolean',
        ];
    }
}
