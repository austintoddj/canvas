<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Enums\AiProvider;
use Canvas\Enums\SettingKey;
use Canvas\Enums\WebhookEvent;
use Canvas\Http\Requests\UpdateIntegrationsRequest;
use Canvas\Jobs\DeliverWebhookJob;
use Canvas\Support\Ai;
use Canvas\Support\Localization;
use Canvas\Support\SettingsRepository;
use Canvas\Support\Unsplash;
use Canvas\Support\WebhookPayload;
use Canvas\Support\Webhooks;
use Canvas\Support\WebhookUrlValidator;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class IntegrationsController extends Controller
{
    public function __construct(
        private readonly SettingsRepository $settings,
    ) {}

    public function show(): JsonResponse
    {
        Gate::forUser(request()->user(config('canvas.guard')))->authorize('manage-integrations');

        return response()->json($this->statusPayload());
    }

    public function update(UpdateIntegrationsRequest $request): JsonResponse
    {
        if ($request->has('unsplash')) {
            /** @var string|null $accessKey */
            $accessKey = $request->input('unsplash.access_key');
            $this->settings->set(SettingKey::UnsplashAccessKey, $accessKey);
        }

        if ($request->has('ai')) {
            $this->updateAiSettings($request);
        }

        $plainSecret = null;

        if ($request->has('webhooks')) {
            $plainSecret = $this->updateWebhookSettings($request);
        }

        return response()->json($this->statusPayload($plainSecret));
    }

    /**
     * Send a signed webhook.test payload immediately (for Integrations "Send test").
     */
    public function testWebhook(): JsonResponse
    {
        Gate::forUser(request()->user(config('canvas.guard')))->authorize('manage-integrations');

        if (! Webhooks::configured()) {
            return response()->json([
                'message' => 'Configure a webhook URL, secret, and at least one event before sending a test.',
                'code' => 'webhooks_not_configured',
            ], 422);
        }

        $url = Webhooks::url();
        $secret = Webhooks::secret();

        if ($url === null || $secret === null || ! WebhookUrlValidator::isAllowed($url)) {
            return response()->json([
                'message' => 'The webhook URL must be a public HTTPS address.',
                'code' => 'webhooks_url_invalid',
            ], 422);
        }

        $deliveryId = (string) Str::uuid();
        $payload = WebhookPayload::test($deliveryId);
        $job = new DeliverWebhookJob(
            url: $url,
            secret: $secret,
            event: WebhookEvent::WebhookTest->value,
            deliveryId: $deliveryId,
            payload: $payload,
        );

        try {
            // Same job as lifecycle delivery; sync so the admin toast reflects a real POST.
            app(Dispatcher::class)->dispatchSync($job);
        } catch (Throwable $exception) {
            return response()->json([
                'message' => 'The test webhook could not be delivered.',
                'code' => 'webhooks_test_failed',
                'detail' => $exception instanceof RuntimeException ? $exception->getMessage() : null,
            ], 502);
        }

        return response()->json([
            'ok' => true,
            'delivery_id' => $deliveryId,
            'event' => WebhookEvent::WebhookTest->value,
        ]);
    }

    private function updateAiSettings(UpdateIntegrationsRequest $request): void
    {
        if ($request->exists('ai.provider')) {
            /** @var string|null $provider */
            $provider = $request->input('ai.provider');
            $this->settings->set(SettingKey::AiProvider, $provider);
        }

        if ($request->exists('ai.api_key')) {
            /** @var string|null $apiKey */
            $apiKey = $request->input('ai.api_key');
            $this->settings->set(SettingKey::AiApiKey, $apiKey);
        }

        if ($request->exists('ai.model')) {
            /** @var string|null $model */
            $model = $request->input('ai.model');
            $this->settings->set(SettingKey::AiModel, $model);
        }
    }

    /**
     * Persist webhook settings. Returns a newly generated plain secret when created or rotated.
     */
    private function updateWebhookSettings(UpdateIntegrationsRequest $request): ?string
    {
        $webhooks = (array) $request->input('webhooks', []);
        $hasUrl = array_key_exists('url', $webhooks);
        $hasEvents = array_key_exists('events', $webhooks);
        $rotate = (bool) ($webhooks['rotate_secret'] ?? false);

        $url = $hasUrl ? $request->input('webhooks.url') : Webhooks::url();

        if ($hasUrl) {
            if (! is_string($url) || $url === '') {
                $this->forgetWebhookSettings();

                return null;
            }

            $this->settings->set(SettingKey::WebhookUrl, $url);
        }

        if ($hasEvents) {
            $events = $request->input('webhooks.events');

            if (! is_array($events) || $events === []) {
                $this->settings->forget(SettingKey::WebhookEvents);
            } else {
                $encoded = json_encode(array_values(array_filter(
                    $events,
                    static fn (mixed $event): bool => is_string($event) && $event !== '',
                )), JSON_THROW_ON_ERROR);

                $this->settings->set(SettingKey::WebhookEvents, $encoded);
            }
        }

        $plainSecret = null;
        $needsSecret = $rotate || (filled(Webhooks::url()) && ! filled(Webhooks::secret()));

        if ($needsSecret && filled(Webhooks::url())) {
            $plainSecret = $this->generateWebhookSecret();
            $this->settings->set(SettingKey::WebhookSecret, $plainSecret);
        }

        return $plainSecret;
    }

    private function forgetWebhookSettings(): void
    {
        $this->settings->forget(SettingKey::WebhookUrl);
        $this->settings->forget(SettingKey::WebhookSecret);
        $this->settings->forget(SettingKey::WebhookEvents);
    }

    private function generateWebhookSecret(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * @return array{
     *     unsplash: array{configured: bool, masked_key: string|null, enabled_at: string|null},
     *     ai: array{configured: bool, provider: string|null, masked_key: string|null, model: string|null, enabled_at: string|null},
     *     webhooks: array{
     *         configured: bool,
     *         url: string|null,
     *         masked_secret: string|null,
     *         events: list<string>,
     *         enabled_at: string|null,
     *         available_events: list<array{id: string, label: string}>,
     *         plain_secret?: string
     *     }
     * }
     */
    private function statusPayload(?string $plainSecret = null): array
    {
        $accessKey = Unsplash::accessKey();
        $aiKey = Ai::apiKey();
        $provider = Ai::provider();
        $unsplashConfigured = filled($accessKey);
        $aiConfigured = Ai::configured();
        $webhooksConfigured = Webhooks::configured();
        $webhookSecret = Webhooks::secret();

        $webhooks = [
            'configured' => $webhooksConfigured,
            'url' => Webhooks::url(),
            'masked_secret' => SettingsRepository::mask($webhookSecret),
            'events' => Webhooks::eventValues(),
            'enabled_at' => $webhooksConfigured
                ? $this->settings->createdAt(SettingKey::WebhookUrl)
                : null,
            'available_events' => WebhookEvent::subscribableOptions($this->requestLocale()),
        ];

        if ($plainSecret !== null) {
            $webhooks['plain_secret'] = $plainSecret;
        }

        return [
            'unsplash' => [
                'configured' => $unsplashConfigured,
                'masked_key' => SettingsRepository::mask($accessKey),
                'enabled_at' => $unsplashConfigured
                    ? $this->settings->createdAt(SettingKey::UnsplashAccessKey)
                    : null,
            ],
            'ai' => [
                'configured' => $aiConfigured,
                'provider' => $provider instanceof AiProvider ? $provider->value : null,
                'masked_key' => SettingsRepository::mask($aiKey),
                'model' => Ai::modelOverride(),
                'enabled_at' => $aiConfigured
                    ? $this->settings->createdAt(SettingKey::AiApiKey)
                    : null,
            ],
            'webhooks' => $webhooks,
        ];
    }

    private function requestLocale(): ?string
    {
        $locale = data_get(request()->user(config('canvas.guard')), 'locale');

        return is_string($locale) ? Localization::resolveLocale($locale) : null;
    }
}
