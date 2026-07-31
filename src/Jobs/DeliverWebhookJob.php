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
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly string $url,
        public readonly string $secret,
        public readonly string $event,
        public readonly string $deliveryId,
        public readonly array $payload,
    ) {}

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

        if (! WebhookUrlValidator::isAllowed($this->url)) {
            $delivery?->markFailed(
                httpStatus: null,
                responseBody: null,
                errorMessage: 'Webhook URL is not allowed.',
            );

            return;
        }

        $body = json_encode($this->payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $timestamp = time();
        $signature = WebhookSigner::sign($this->secret, $body, $timestamp);

        $response = Http::timeout(10)
            ->withHeaders([
                'User-Agent' => 'Canvas-Webhooks/1.0',
                'Canvas-Event' => $this->event,
                'Canvas-Delivery-Id' => $this->deliveryId,
                'Canvas-Signature' => $signature,
            ])
            ->withBody($body, 'application/json')
            ->post($this->url);

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
}
