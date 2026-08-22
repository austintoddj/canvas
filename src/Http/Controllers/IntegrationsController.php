<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Enums\AiProvider;
use Canvas\Enums\IntegrationStatus;
use Canvas\Enums\SettingKey;
use Canvas\Enums\WebhookDeliveryStatus;
use Canvas\Enums\WebhookEvent;
use Canvas\Exceptions\IntegrationVerificationException;
use Canvas\Http\Requests\UpdateIntegrationsRequest;
use Canvas\Jobs\DeliverWebhookJob;
use Canvas\Models\WebhookDelivery;
use Canvas\Support\Ai;
use Canvas\Support\IntegrationVerifier;
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
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class IntegrationsController extends Controller
{
    public function __construct(
        private readonly SettingsRepository $settings,
        private readonly IntegrationVerifier $verifier,
    ) {}

    public function show(): JsonResponse
    {
        Gate::forUser(request()->user(config('canvas.guard')))->authorize('manage-integrations');

        return response()->json($this->statusPayload());
    }

    public function update(UpdateIntegrationsRequest $request): JsonResponse
    {
        if ($request->has('unsplash')) {
            $this->updateUnsplashSettings($request);
        }

        if ($request->has('ai')) {
            $this->updateAiSettings($request);
        }

        $plainSecret = null;
        $verifyError = null;

        if ($request->has('webhooks')) {
            [$plainSecret, $verifyError] = $this->updateWebhookSettings($request);
        }

        return response()->json($this->statusPayload($plainSecret, $verifyError));
    }

    /**
     * Send a signed webhook.test payload immediately (for Integrations "Send test").
     */
    public function testWebhook(): JsonResponse
    {
        Gate::forUser(request()->user(config('canvas.guard')))->authorize('manage-integrations');

        if (! Webhooks::hasCredentials()) {
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

        WebhookDelivery::query()->create([
            'id' => $deliveryId,
            'event' => WebhookEvent::WebhookTest->value,
            'url' => $url,
            'status' => WebhookDeliveryStatus::Pending,
            'attempts' => 0,
            'payload' => WebhookDelivery::capPayload($payload),
            'post_id' => null,
        ]);

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
            $delivery = WebhookDelivery::query()->find($deliveryId);

            if ($delivery !== null && $delivery->status === WebhookDeliveryStatus::Pending) {
                $delivery->markFailed(
                    httpStatus: $delivery->http_status,
                    responseBody: $delivery->response_body,
                    errorMessage: $exception instanceof RuntimeException
                        ? $exception->getMessage()
                        : 'The test webhook could not be delivered.',
                );
            }

            return response()->json([
                'message' => 'The test webhook could not be delivered.',
                'code' => 'webhooks_test_failed',
                'detail' => $exception instanceof RuntimeException ? $exception->getMessage() : null,
                'delivery_id' => $deliveryId,
            ], 502);
        }

        $this->markWebhooksEnabled();

        return response()->json([
            'ok' => true,
            'delivery_id' => $deliveryId,
            'event' => WebhookEvent::WebhookTest->value,
        ]);
    }

    private function updateUnsplashSettings(UpdateIntegrationsRequest $request): void
    {
        /** @var string|null $accessKey */
        $accessKey = $request->input('unsplash.access_key');

        if (is_string($accessKey) && $accessKey !== '') {
            $this->verifyOrFail(fn () => $this->verifier->verifyUnsplash($accessKey));
        }

        $this->settings->set(SettingKey::UnsplashAccessKey, $accessKey);
    }

    private function updateAiSettings(UpdateIntegrationsRequest $request): void
    {
        $clearingKey = $request->exists('ai.api_key') && ! filled($request->input('ai.api_key'));

        if (! $clearingKey) {
            $this->verifyAiPayload($request);
        }

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

    private function verifyAiPayload(UpdateIntegrationsRequest $request): void
    {
        $providerValue = $request->exists('ai.provider')
            ? $request->input('ai.provider')
            : Ai::provider()?->value;
        $provider = is_string($providerValue) ? AiProvider::tryFrom($providerValue) : null;

        $apiKey = $request->exists('ai.api_key') && filled($request->input('ai.api_key'))
            ? (string) $request->input('ai.api_key')
            : Ai::apiKey();

        $model = $request->exists('ai.model')
            ? $request->input('ai.model')
            : Ai::modelOverride();
        $model = is_string($model) && $model !== '' ? $model : null;

        $keyChanging = $request->exists('ai.api_key') && filled($request->input('ai.api_key'));
        $modelChanging = $request->exists('ai.model');

        if ($provider === null || ! filled($apiKey)) {
            return;
        }

        if (! $keyChanging && ! $modelChanging && Ai::configured()) {
            return;
        }

        $this->verifyOrFail(fn () => $this->verifier->verifyAi($provider, (string) $apiKey, $model));
    }

    /**
     * Persist webhook settings. Returns [plain secret if created/rotated, verify error if test failed].
     *
     * @return array{0: string|null, 1: string|null}
     */
    private function updateWebhookSettings(UpdateIntegrationsRequest $request): array
    {
        $webhooks = (array) $request->input('webhooks', []);
        $hasUrl = array_key_exists('url', $webhooks);
        $hasEvents = array_key_exists('events', $webhooks);
        $rotate = (bool) ($webhooks['rotate_secret'] ?? false);
        $previousUrl = Webhooks::url();
        $wasConfigured = Webhooks::configured();

        $url = $hasUrl ? $request->input('webhooks.url') : $previousUrl;

        if ($hasUrl) {
            if (! is_string($url) || $url === '') {
                $this->forgetWebhookSettings();

                return [null, null];
            }

            $this->settings->set(SettingKey::WebhookUrl, $url);
        }

        if ($hasEvents) {
            $events = $request->input('webhooks.events');

            if (! is_array($events) || $events === []) {
                $this->settings->forget(SettingKey::WebhookEvents);
                $this->settings->forget(SettingKey::WebhookStatus);
                $this->settings->forget(SettingKey::WebhookVerifiedAt);
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

        $urlChanged = $hasUrl && $url !== $previousUrl;
        $shouldVerify = Webhooks::hasCredentials() && ($urlChanged || ! $wasConfigured);

        if (! $shouldVerify) {
            return [$plainSecret, null];
        }

        // Drop Enabled for the duration of the probe so lifecycle events cannot
        // fire at an unverified URL. Stay Off if the test fails.
        $this->clearWebhookVerification();
        $verifyError = $this->deliverVerificationTest();

        if ($verifyError === null) {
            $this->markWebhooksEnabled();
        }

        return [$plainSecret, $verifyError];
    }

    private function clearWebhookVerification(): void
    {
        $this->settings->forget(SettingKey::WebhookStatus);
        $this->settings->forget(SettingKey::WebhookVerifiedAt);
    }

    private function markWebhooksEnabled(): void
    {
        if (! Webhooks::hasCredentials()) {
            return;
        }

        $this->settings->set(SettingKey::WebhookStatus, IntegrationStatus::Enabled->value);
        $this->settings->set(SettingKey::WebhookVerifiedAt, now()->toIso8601String());
    }

    /**
     * Send the same signed webhook.test used by "Send test". Null on 2xx.
     */
    private function deliverVerificationTest(): ?string
    {
        $url = Webhooks::url();
        $secret = Webhooks::secret();

        if ($url === null || $secret === null || ! WebhookUrlValidator::isAllowed($url)) {
            return 'The webhook URL must be a public HTTPS address.';
        }

        $deliveryId = (string) Str::uuid();
        $payload = WebhookPayload::test($deliveryId);

        WebhookDelivery::query()->create([
            'id' => $deliveryId,
            'event' => WebhookEvent::WebhookTest->value,
            'url' => $url,
            'status' => WebhookDeliveryStatus::Pending,
            'attempts' => 0,
            'payload' => WebhookDelivery::capPayload($payload),
            'post_id' => null,
        ]);

        $job = new DeliverWebhookJob(
            url: $url,
            secret: $secret,
            event: WebhookEvent::WebhookTest->value,
            deliveryId: $deliveryId,
            payload: $payload,
        );

        try {
            app(Dispatcher::class)->dispatchSync($job);
        } catch (Throwable $exception) {
            $delivery = WebhookDelivery::query()->find($deliveryId);

            if ($delivery !== null && $delivery->status === WebhookDeliveryStatus::Pending) {
                $delivery->markFailed(
                    httpStatus: $delivery->http_status,
                    responseBody: $delivery->response_body,
                    errorMessage: $exception instanceof RuntimeException
                        ? $exception->getMessage()
                        : 'The test webhook could not be delivered.',
                );
            }

            return $exception instanceof RuntimeException
                ? $exception->getMessage()
                : 'The test webhook could not be delivered.';
        }

        return null;
    }

    /**
     * @param  callable(): void  $verify
     */
    private function verifyOrFail(callable $verify): void
    {
        try {
            $verify();
        } catch (IntegrationVerificationException $exception) {
            throw ValidationException::withMessages([
                $exception->field => [$exception->getMessage()],
            ]);
        }
    }

    private function forgetWebhookSettings(): void
    {
        $this->settings->forget(SettingKey::WebhookUrl);
        $this->settings->forget(SettingKey::WebhookSecret);
        $this->settings->forget(SettingKey::WebhookEvents);
        $this->settings->forget(SettingKey::WebhookStatus);
        $this->settings->forget(SettingKey::WebhookVerifiedAt);
    }

    private function generateWebhookSecret(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * @return array{
     *     unsplash: array{status: string, configured: bool, masked_key: string|null, enabled_at: string|null},
     *     ai: array{status: string, configured: bool, provider: string|null, masked_key: string|null, model: string|null, enabled_at: string|null},
     *     webhooks: array{
     *         status: string,
     *         configured: bool,
     *         pending: bool,
     *         url: string|null,
     *         masked_secret: string|null,
     *         events: list<string>,
     *         enabled_at: string|null,
     *         available_events: list<array{id: string, label: string, description: string}>,
     *         plain_secret?: string,
     *         verify_error?: string
     *     }
     * }
     */
    private function statusPayload(?string $plainSecret = null, ?string $verifyError = null): array
    {
        $accessKey = Unsplash::accessKey();
        $aiKey = Ai::apiKey();
        $provider = Ai::provider();
        $unsplashStatus = filled($accessKey) ? IntegrationStatus::Enabled : IntegrationStatus::Off;
        $aiStatus = Ai::configured() ? IntegrationStatus::Enabled : IntegrationStatus::Off;
        $webhooksStatus = Webhooks::status();
        $webhookSecret = Webhooks::secret();

        $webhooks = [
            'status' => $webhooksStatus->value,
            'configured' => $webhooksStatus === IntegrationStatus::Enabled,
            'pending' => Webhooks::pending(),
            'url' => Webhooks::url(),
            'masked_secret' => SettingsRepository::mask($webhookSecret),
            'events' => Webhooks::eventValues(),
            'enabled_at' => $webhooksStatus === IntegrationStatus::Enabled
                ? Webhooks::verifiedAt()
                : null,
            'available_events' => WebhookEvent::subscribableOptions($this->requestLocale()),
        ];

        if ($plainSecret !== null) {
            $webhooks['plain_secret'] = $plainSecret;
        }

        if ($verifyError !== null) {
            $webhooks['verify_error'] = $verifyError;
        }

        return [
            'unsplash' => [
                'status' => $unsplashStatus->value,
                'configured' => $unsplashStatus === IntegrationStatus::Enabled,
                'masked_key' => SettingsRepository::mask($accessKey),
                'enabled_at' => $unsplashStatus === IntegrationStatus::Enabled
                    ? $this->settings->createdAt(SettingKey::UnsplashAccessKey)
                    : null,
            ],
            'ai' => [
                'status' => $aiStatus->value,
                'configured' => $aiStatus === IntegrationStatus::Enabled,
                'provider' => $provider instanceof AiProvider ? $provider->value : null,
                'masked_key' => SettingsRepository::mask($aiKey),
                'model' => Ai::modelOverride(),
                'enabled_at' => $aiStatus === IntegrationStatus::Enabled
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
