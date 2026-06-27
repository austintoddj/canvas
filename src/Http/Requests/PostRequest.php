<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Illuminate\Validation\Rule;

class PostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $user = $this->user(config('canvas.guard'));

        return [
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_posts')->where(function ($query) use ($user) {
                    return $query->where('slug', $this->input('slug'))->where('user_id', $user->id);
                })->ignore($this->route('id'))->whereNull('deleted_at'),
            ],
            'title' => 'required',
            'summary' => 'nullable|string',
            'body' => 'nullable|string',
            'published_at' => 'nullable|date',
            'featured_image' => 'nullable|string',
            'featured_image_caption' => 'nullable|string',
            'meta' => 'nullable|array',
        ];
    }
}
