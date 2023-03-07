<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StoreImageRequest extends FormRequest
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
        return [
            'file' => [
                'required',
                File::types(['png', 'jpg'])->max(config('canvas.upload_filesize')),
            ],
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
            'file.required' => trans('canvas::app.id_required'),
            'id.uuid' => trans('canvas::app.id_uuid'),
            //            'name.required' => trans('canvas::app.name_required'),
            //            'name.string' => trans('canvas::app.name_string'),
            //            'slug.required' => trans('canvas::app.slug_required'),
            //            'slug.alpha_dash' => trans('canvas::app.slug_alpha_dash'),
            //            'slug.unique' => trans('canvas::app.slug_unique'),
            //            'user_id.uuid' => trans('canvas::app.user_id_uuid'),
        ];
    }
}
