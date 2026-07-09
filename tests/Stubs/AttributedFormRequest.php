<?php

declare(strict_types=1);

namespace Canvas\Tests\Stubs;

use Canvas\Http\Requests\FormRequest;
use Illuminate\Foundation\Http\Attributes\ErrorBag;
use Illuminate\Foundation\Http\Attributes\FailOnUnknownFields;
use Illuminate\Foundation\Http\Attributes\RedirectTo;
use Illuminate\Foundation\Http\Attributes\RedirectToRoute;
use Illuminate\Foundation\Http\Attributes\StopOnFirstFailure;
use Illuminate\Validation\Validator;

#[StopOnFirstFailure]
#[RedirectTo('/canvas')]
#[RedirectToRoute('canvas')]
#[ErrorBag('canvas')]
#[FailOnUnknownFields]
class AttributedFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string',
            'password' => 'nullable|string',
            'password_confirmation' => 'nullable|string',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            // exercise withValidator hook
        });
    }

    public function after(Validator $validator): array
    {
        return [
            function (Validator $validator): void {
                // exercise after hook
            },
        ];
    }
}
