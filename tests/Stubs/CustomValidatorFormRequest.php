<?php

declare(strict_types=1);

namespace Canvas\Tests\Stubs;

use Canvas\Http\Requests\FormRequest;
use Illuminate\Contracts\Validation\Factory as ValidationFactory;
use Illuminate\Contracts\Validation\Validator;

class CustomValidatorFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function validator(ValidationFactory $factory): Validator
    {
        return $factory->make($this->all(), [
            'name' => 'required|string',
        ]);
    }
}
