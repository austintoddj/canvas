<?php

declare(strict_types=1);

namespace Canvas\Http\Requests;

use Canvas\Enums\AiProvider;
use Canvas\Enums\WebhookEvent;
use Canvas\Support\Ai;
use Canvas\Support\Webhooks;
use Canvas\Support\WebhookUrlValidator;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateIntegrationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::forUser($this->user(config('canvas.guard')))->allows('manage-integrations');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'unsplash' => ['sometimes', 'array'],
            'unsplash.access_key' => ['nullable', 'string', 'max:255'],
            'ai' => ['sometimes', 'array'],
            'ai.provider' => ['nullable', 'string', Rule::in(AiProvider::values())],
            'ai.api_key' => ['nullable', 'string', 'max:512'],
            'ai.model' => ['nullable', 'string', 'max:100'],
            'webhooks' => ['sometimes', 'array'],
            'webhooks.url' => ['nullable', 'string', 'max:2048'],
            'webhooks.events' => ['sometimes', 'nullable', 'array'],
            'webhooks.events.*' => ['string', Rule::in(WebhookEvent::subscribableValues())],
            'webhooks.rotate_secret' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->has('unsplash') && ! $this->has('ai') && ! $this->has('webhooks')) {
                $validator->errors()->add('integrations', 'At least one integration payload is required.');
            }

            if ($this->has('ai') && $this->filled('ai.api_key') && ! $this->filled('ai.provider') && Ai::provider() === null) {
                $validator->errors()->add('ai.provider', 'A provider is required when saving an API key.');
            }

            $this->validateWebhooks($validator);
        });
    }

    private function validateWebhooks(Validator $validator): void
    {
        if (! $this->has('webhooks')) {
            return;
        }

        /** @var string|null $url */
        $url = $this->input('webhooks.url');
        $hasUrlKey = array_key_exists('url', (array) $this->input('webhooks', []));
        $eventsInput = $this->input('webhooks.events');
        $hasEventsKey = array_key_exists('events', (array) $this->input('webhooks', []));
        $rotate = (bool) $this->input('webhooks.rotate_secret', false);

        if ($hasUrlKey && ($url === null || $url === '')) {
            return;
        }

        $effectiveUrl = filled($url) ? $url : Webhooks::url();

        if (filled($url) && ! WebhookUrlValidator::isAllowed((string) $url)) {
            $validator->errors()->add(
                'webhooks.url',
                'The webhook URL must be a public HTTPS address.',
            );
        }

        /** @var list<string>|null $events */
        $events = is_array($eventsInput) ? array_values($eventsInput) : null;
        $effectiveEvents = $events ?? Webhooks::eventValues();

        if (filled($effectiveUrl) && $effectiveEvents === []) {
            $validator->errors()->add(
                'webhooks.events',
                'Select at least one event to subscribe to.',
            );
        }

        if ($rotate && ! filled($effectiveUrl)) {
            $validator->errors()->add(
                'webhooks.url',
                'Configure a webhook URL before rotating the signing secret.',
            );
        }
    }

    private function normalizeApiKey(string $value): ?string
    {
        $key = trim($value);

        if ($key === '') {
            return null;
        }

        if (preg_match('/^Bearer\s+/i', $key) === 1) {
            $key = trim((string) preg_replace('/^Bearer\s+/i', '', $key));
        }

        return $key === '' ? null : $key;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('unsplash')) {
            $accessKey = data_get($this->all(), 'unsplash.access_key');

            if (is_string($accessKey)) {
                $accessKey = trim($accessKey);
            }

            if ($accessKey === '' || $accessKey === null) {
                $this->merge([
                    'unsplash' => array_merge(
                        (array) $this->input('unsplash', []),
                        ['access_key' => null],
                    ),
                ]);
            } elseif (is_string($accessKey)) {
                $this->merge([
                    'unsplash' => array_merge(
                        (array) $this->input('unsplash', []),
                        ['access_key' => $accessKey],
                    ),
                ]);
            }
        }

        if ($this->has('ai')) {
            $ai = (array) $this->input('ai', []);

            if (array_key_exists('api_key', $ai)) {
                $apiKey = $ai['api_key'];
                if (is_string($apiKey)) {
                    $ai['api_key'] = $this->normalizeApiKey($apiKey);
                } elseif ($apiKey === null) {
                    $ai['api_key'] = null;
                }
            }

            if (array_key_exists('model', $ai)) {
                $model = $ai['model'];
                if (is_string($model)) {
                    $trimmed = trim($model);
                    $ai['model'] = $trimmed === '' ? null : $trimmed;
                } elseif ($model === null) {
                    $ai['model'] = null;
                }
            }

            if (array_key_exists('provider', $ai)) {
                $provider = $ai['provider'];
                if (is_string($provider) && trim($provider) === '') {
                    $ai['provider'] = null;
                }
            }

            $this->merge(['ai' => $ai]);
        }

        if ($this->has('webhooks')) {
            $webhooks = (array) $this->input('webhooks', []);

            if (array_key_exists('url', $webhooks)) {
                $url = $webhooks['url'];
                if (is_string($url)) {
                    $trimmed = trim($url);
                    $webhooks['url'] = $trimmed === '' ? null : $trimmed;
                } elseif ($url === null) {
                    $webhooks['url'] = null;
                }
            }

            if (array_key_exists('events', $webhooks) && is_array($webhooks['events'])) {
                $webhooks['events'] = array_values(array_filter(
                    $webhooks['events'],
                    static fn (mixed $event): bool => is_string($event) && $event !== '',
                ));
            }

            if (array_key_exists('rotate_secret', $webhooks)) {
                $webhooks['rotate_secret'] = filter_var($webhooks['rotate_secret'], FILTER_VALIDATE_BOOLEAN);
            }

            $this->merge(['webhooks' => $webhooks]);
        }
    }
}
