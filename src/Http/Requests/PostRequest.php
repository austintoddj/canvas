<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Models\Post;
use Illuminate\Validation\Rule;

class PostRequest extends FormRequest
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
        $user = $this->user(config('canvas.guard'));
        $postId = $this->route('id');
        $post = is_string($postId) ? Post::query()->find($postId) : null;
        $ownerId = $post instanceof Post ? $post->user_id : data_get($user, 'id');

        return [
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_posts')->where(function ($query) use ($ownerId) {
                    return $query->where('slug', $this->input('slug'))->where('user_id', $ownerId);
                })->ignore(is_string($postId) ? $postId : null)->whereNull('deleted_at'),
            ],
            'title' => 'required',
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
