<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Models\Post;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $post = Post::query()->find($this->route('id'));

        if ($post && request()->user('canvas')->isContributor) {
            return request()->user('canvas')->id === $post->user_id;
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $connection = config('canvas.database_connection');

        return [
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique("{$connection}.canvas_posts")->where(function (Builder $query) {
                    return $query->where('slug', request('slug'))->where('user_id', request()->user('canvas')->id);
                })->ignore($this->route('id'))->whereNull('deleted_at'),
            ],
            'title' => 'required|string',
            'summary' => 'nullable|string',
            'body' => 'nullable|string',
            'published_at' => 'nullable|date',
            'featured_image' => 'nullable|string',
            'featured_image_caption' => 'nullable|string',
            'user_id' => 'required|uuid',
            'topic_id' => 'nullable|uuid',
            'meta' => 'nullable|array',
        ];
    }

    /**
     * Get the error messages for the defined validation rules.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'slug.required' => trans('canvas::app.slug_required'),
            'slug.alpha_dash' => trans('canvas::app.slug_alpha_dash'),
            'slug.unique' => trans('canvas::app.slug_unique'),
            'title.required' => trans('canvas::app.title_required'),
            'title.string' => trans('canvas::app.title_string'),
            'summary.string' => trans('canvas::app.summary_string'),
            'body.string' => trans('canvas::app.body_string'),
            'published_at.date' => trans('canvas::app.published_at_date'),
            'featured_image.string' => trans('canvas::app.featured_image_string'),
            'featured_image_caption.string' => trans('canvas::app.featured_image_caption_string'),
            'user_id.required' => trans('canvas::app.user_id_required'),
            'user_id.uuid' => trans('canvas::app.user_id_uuid'),
            'topic_id.uuid' => trans('canvas::app.topic_id_uuid'),
            'meta.array' => trans('canvas::app.meta_array'),
        ];
    }
}
