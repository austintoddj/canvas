<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Illuminate\Validation\Rule;

class TagRequest extends FormRequest
{
    /**
     * @return bool
     */
    public function authorize()
    {
        return $this->user(config('canvas.guard'))->can('manage-taxonomy');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => 'required',
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_tags')->where(function ($query) {
                    return $query->where('slug', request('slug'))->where('user_id', request()->user(config('canvas.guard'))->id);
                })->ignore(request('id'))->whereNull('deleted_at'),
            ],
        ];
    }
}
