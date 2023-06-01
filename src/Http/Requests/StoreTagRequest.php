<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTagRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return request()->user('canvas')->isAdmin;
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
            'name' => 'required|string',
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique("{$connection}.canvas_tags")->where(function (Builder $query) {
                    return $query->where('slug', request('slug'))->where('user_id', request()->user('canvas')->id);
                })->ignore($this->route('id'))->whereNull('deleted_at'),
            ],
            'user_id' => 'required|uuid',
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
            'name.required' => trans('canvas::app.name_required'),
            'name.string' => trans('canvas::app.name_string'),
            'slug.required' => trans('canvas::app.slug_required'),
            'slug.alpha_dash' => trans('canvas::app.slug_alpha_dash'),
            'slug.unique' => trans('canvas::app.slug_unique'),
            'user_id.required' => trans('canvas::app.user_id_required'),
            'user_id.uuid' => trans('canvas::app.user_id_uuid'),
        ];
    }
}
