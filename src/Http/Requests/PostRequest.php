<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Models\Post;
use Canvas\Support\Localization;
use Canvas\Support\MediaUrl;
use Canvas\Support\PublishedAt;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class PostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('featured_image')) {
            $this->merge([
                'featured_image' => MediaUrl::toStoredMediaReference(
                    is_string($this->input('featured_image')) ? $this->input('featured_image') : null,
                ),
            ]);
        }

        if ($this->boolean('publish_now')) {
            $this->merge(['published_at' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $postId = $this->route('id');
        $post = is_string($postId) ? Post::query()->find($postId) : null;

        // Drafts may be created or updated without a title; lists show “Untitled post”.
        // Publishing still requires a title (promote + published_at / publish_now / schedule).
        $titleRules = ['nullable', 'string'];

        $isPublishing = $this->boolean('promote') && (
            $this->boolean('publish_now')
            || $this->boolean('schedule')
            || filled($this->input('published_at'))
        );

        if ($isPublishing) {
            $titleRules = ['required', 'string'];
        }

        $publishedAtRules = [
            'nullable',
            'string',
            function (string $attribute, mixed $value, \Closure $fail): void {
                if ($value === null || $value === '') {
                    return;
                }

                if (! is_string($value)) {
                    $fail(__('validation.date', ['attribute' => $attribute]));

                    return;
                }

                if (! PublishedAt::hasTimezone($value)) {
                    $fail(__('validation.date', ['attribute' => $attribute]));

                    return;
                }

                try {
                    PublishedAt::parse($value);
                } catch (\InvalidArgumentException) {
                    $fail(__('validation.date', ['attribute' => $attribute]));
                }
            },
        ];

        if ($this->boolean('schedule')) {
            $publishedAtRules = [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_string($value) || ! PublishedAt::hasTimezone($value)) {
                        $fail(__('validation.date', ['attribute' => $attribute]));

                        return;
                    }

                    try {
                        $at = PublishedAt::parse($value);
                    } catch (\InvalidArgumentException) {
                        $fail(__('validation.date', ['attribute' => $attribute]));

                        return;
                    }

                    if ($at->lessThanOrEqualTo(now())) {
                        $fail(__('validation.after', [
                            'attribute' => $attribute,
                            'date' => 'now',
                        ]));
                    }
                },
            ];
        }

        return [
            'slug' => $this->slugRules($post, is_string($postId) ? $postId : null),
            'title' => $titleRules,
            'summary' => 'nullable|string',
            'body' => 'nullable|string',
            'published_at' => $publishedAtRules,
            'featured_image' => 'nullable|string|max:'.Post::FEATURED_IMAGE_MAX_LENGTH,
            'featured_image_caption' => 'nullable|string',
            'meta' => 'nullable|array',
            'promote' => 'sometimes|boolean',
            'schedule' => 'sometimes|boolean',
            'publish_now' => 'sometimes|boolean',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        $locale = data_get($this->user(config('canvas.guard')), 'locale');

        return [
            'slug.unique' => (string) trans(
                'canvas::app.editor.slug_taken',
                [],
                Localization::resolveTranslationLocale(is_string($locale) && $locale !== '' ? $locale : null),
            ),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->boolean('schedule') && $this->boolean('publish_now')) {
                $validator->errors()->add('schedule', 'The schedule and publish_now options cannot both be true.');
            }
        });
    }

    /**
     * A post may keep a slug it already shares. Any new slug must be unused
     * by every other post, because public URLs address posts by slug alone.
     *
     * @return list<mixed>
     */
    private function slugRules(?Post $post, ?string $postId): array
    {
        $rules = [
            'required',
            'alpha_dash',
        ];

        $submittedSlug = $this->input('slug');

        if ($post instanceof Post && is_string($submittedSlug) && $post->slug === $submittedSlug) {
            return $rules;
        }

        $rules[] = Rule::unique('canvas_posts', 'slug')
            ->ignore($postId)
            ->whereNull('deleted_at');

        return $rules;
    }
}
