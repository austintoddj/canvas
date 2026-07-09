<?php

declare(strict_types=1);

namespace Canvas\Tests\Stubs;

use Canvas\Http\Requests\FormRequest;

class NoAuthorizeFormRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string',
        ];
    }
}
