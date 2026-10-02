<?php

declare(strict_types=1);

namespace Canvas\Jobs;

use Canvas\Enums\WebhookDeliveryStatus;
use Canvas\Models\WebhookDelivery;
use Canvas\Support\WebhookSigner;
use Canvas\Support\WebhookUrlValidator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * Outbound webhook HTTP POST.
 *
 * Lifecycle events queue this job (same pattern as digest mail). Integrations
 * "Send test" runs the same job via dispatchSync for immediate feedback.
 * Delivery rows (when present) track attempts, HTTP outcome, and final status.
 */
final class DeliverWebhookJob implements ShouldQueue
{
    use InteractsWithQueue;
    use Queueable;

    public int $tries = 3;

    /**
     * @internal Tests simulate a missing curl extension without unloading it.
     */
    private static ?bool $curlAvailableOverride = null;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly string $url,
        public readonly string $secret,
        public readonly string $event,
        public readonly string $deliveryId,
        public readonly array $payload,
    ) {
        // After the surrounding DB transaction so the delivery row is visible to workers.
        $this->afterCommit = true;
    }

    /**
     * @return list<int>
     */
    public function backoff(): array
    {
        return [30, 120, 600];
    }

    public function handle(): void
    {
        $delivery = $this->delivery();

        if ($delivery !== null) {
            $delivery->incrementAttempts();
        }

        $target = WebhookUrlValidator::validatedTarget($this->url);

        if ($target === null) {
            $delivery?->markFailed(
                httpStatus: null,
                responseBody: null,
                errorMessage: 'Webhook URL is not allowed.',
            );

            return;
        }

        $curlOptions = self::curlOptions($target);

        if ($curlOptions === null) {
            $delivery?->markFailed(
                httpStatus: null,
                responseBody: null,
                errorMessage: 'Webhook delivery requires the PHP curl extension.',
            );

            return;
        }

        $body = json_encode($this->payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $timestamp = time();
        $signature = WebhookSigner::sign($this->secret, $body, $timestamp);

        $pending = Http::timeout(10)
            ->withoutRedirecting()
            ->withHeaders([
                'User-Agent' => 'Canvas-Webhooks/1.0',
                'Canvas-Event' => $this->event,
                'Canvas-Delivery-Id' => $this->deliveryId,
                'Canvas-Signature' => $signature,
            ])
            ->withBody($body, 'application/json');

        if ($curlOptions !== []) {
            $pending = $pending->withOptions([
                'curl' => $curlOptions,
            ]);
        }

        $response = $pending->post($this->url);

        $responseBody = $response->body();

        if (! $response->successful()) {
            $message = "Canvas webhook delivery failed with HTTP {$response->status()} for event [{$this->event}].";
            $delivery?->recordAttempt(
                httpStatus: $response->status(),
                responseBody: $responseBody,
                errorMessage: $message,
            );

            throw new RuntimeException($message);
        }

        $delivery?->markSuccess(
            httpStatus: $response->status(),
            responseBody: $responseBody,
        );
    }

    /**
     * Curl options for a validated target.
     *
     * Hostname targets are pinned with CURLOPT_RESOLVE so the connection uses
     * an address from validation. The request URL stays the original hostname
     * for the Host header and TLS. IP literals are not pinned. Null when a
     * hostname pin is required and the curl extension is unavailable.
     *
     * @param  array{host: string, port: int, ips: list<string>}  $target
     * @return array<int, mixed>|null
     */
    public static function curlOptions(array $target): ?array
    {
        $curlAvailable = self::$curlAvailableOverride ?? self::curlExtensionSupportsPinning();
        $needsPin = filter_var($target['host'], FILTER_VALIDATE_IP) === false;

        if (! $curlAvailable) {
            return $needsPin ? null : [];
        }

        $options = [
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        ];

        if (defined('CURLOPT_PROTOCOLS_STR')) {
            $options[CURLOPT_PROTOCOLS_STR] = 'https';
        }

        if (! $needsPin) {
            return $options;
        }

        $ip = $target['ips'][0] ?? '';

        if ($ip === '') {
            return null;
        }

        $options[CURLOPT_RESOLVE] = [
            sprintf('%s:%d:%s', $target['host'], $target['port'], self::resolveEntryAddress($ip)),
        ];

        return $options;
    }

    /**
     * @internal Tests simulate a missing curl extension without unloading it.
     */
    public static function fakeCurlAvailability(?bool $available): void
    {
        self::$curlAvailableOverride = $available;
    }

    public function failed(?Throwable $exception): void
    {
        $delivery = $this->delivery();

        if ($delivery === null || $delivery->status !== WebhookDeliveryStatus::Pending) {
            return;
        }

        $delivery->markFailed(
            httpStatus: $delivery->http_status,
            responseBody: $delivery->response_body,
            errorMessage: $exception?->getMessage() ?? $delivery->error_message,
        );
    }

    private function delivery(): ?WebhookDelivery
    {
        return WebhookDelivery::query()->find($this->deliveryId);
    }

    private static function curlExtensionSupportsPinning(): bool
    {
        return extension_loaded('curl')
            && defined('CURLOPT_RESOLVE')
            && defined('CURLOPT_PROTOCOLS')
            && defined('CURLPROTO_HTTPS');
    }

    private static function resolveEntryAddress(string $ip): string
    {
        if (str_contains($ip, ':')) {
            return '['.$ip.']';
        }

        return $ip;
    }
}
