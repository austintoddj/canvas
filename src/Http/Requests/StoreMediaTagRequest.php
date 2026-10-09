<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Models\MediaTag;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Validator;

class StoreMediaTagRequest extends FormRequest
{
    private ?MediaTag $collidingTag = null;

    public function authorize(): bool
    {
        $id = (string) $this->route('id');
        $user = $this->user(config('canvas.guard'));
        $tag = MediaTag::query()->find($id);

        if ($tag === null) {
            return Gate::forUser($user)->allows('create', MediaTag::class);
        }

        return Gate::forUser($user)->allows('update', $tag);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $name = $this->input('name');

        if (is_string($name)) {
            $this->merge([
                'name' => trim($name),
            ]);
        }
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $name = (string) $this->input('name');
            $slug = MediaTag::slugFor($name);
            $id = (string) $this->route('id');

            $existing = MediaTag::query()
                ->where('slug', $slug)
                ->where('id', '!=', $id)
                ->first();

            if ($existing === null) {
                return;
            }

            $this->collidingTag = $existing;
            $validator->errors()->add('name', trans('canvas::app.media.tags_exists'));
        });
    }

    protected function failedValidation(ValidatorContract $validator): void
    {
        if (! $validator instanceof Validator) {
            throw new \RuntimeException('Expected Illuminate\\Validation\\Validator instance.');
        }

        $exception = (new ValidationException($validator))
            ->errorBag($this->errorBag)
            ->redirectTo($this->getRedirectUrl());

        if ($this->collidingTag !== null) {
            $exception->response = response()->json([
                'message' => (string) ($validator->errors()->first() ?: trans('canvas::app.media.tags_exists')),
                'errors' => $validator->errors()->toArray(),
                'tag' => [
                    'id' => (string) $this->collidingTag->id,
                    'name' => (string) $this->collidingTag->name,
                ],
            ], 422);
        }

        throw $exception;
    }
}
