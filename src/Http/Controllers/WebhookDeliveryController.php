<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Enums\WebhookDeliveryStatus;
use Canvas\Jobs\DeliverWebhookJob;
use Canvas\Models\WebhookDelivery;
use Canvas\Support\Webhooks;
use Canvas\Support\WebhookUrlValidator;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class WebhookDeliveryController extends Controller
{
    public function index(): JsonResponse
    {
        Gate::forUser(request()->user(config('canvas.guard')))->authorize('manage-integrations');

        $query = WebhookDelivery::query()
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $status = request()->query('status');

        if (is_string($status) && $status !== '' && in_array($status, WebhookDeliveryStatus::values(), true)) {
            $query->where('status', $status);
        }

        $event = request()->query('event');

        if (is_string($event) && $event !== '') {
            $query->where('event', $event);
        }

        $page = $query->paginate()->through(
            fn (WebhookDelivery $delivery): array => $this->transform($delivery),
        );

        return response()->json($page);
    }

    public function show(WebhookDelivery $delivery): JsonResponse
    {
        Gate::forUser(request()->user(config('canvas.guard')))->authorize('manage-integrations');

        return response()->json($this->transform($delivery));
    }

    public function retry(WebhookDelivery $delivery): JsonResponse
    {
        Gate::forUser(request()->user(config('canvas.guard')))->authorize('manage-integrations');

        if ($delivery->status !== WebhookDeliveryStatus::Failed) {
            return response()->json([
                'message' => 'Only failed deliveries can be retried.',
                'code' => 'webhooks_delivery_not_failed',
            ], 422);
        }

        if (! Webhooks::configured()) {
            return response()->json([
                'message' => 'Configure a webhook URL, secret, and at least one event before retrying.',
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

        /** @var array<string, mixed> $payload */
        $payload = is_array($delivery->payload) ? $delivery->payload : [];
        $newDeliveryId = (string) Str::uuid();
        $payload['delivery_id'] = $newDeliveryId;
        $payload['created_at'] = now()->toIso8601String();

        $retry = WebhookDelivery::query()->create([
            'id' => $newDeliveryId,
            'event' => $delivery->event,
            'url' => $url,
            'status' => WebhookDeliveryStatus::Pending,
            'attempts' => 0,
            'payload' => WebhookDelivery::capPayload($payload),
            'post_id' => $delivery->post_id,
        ]);

        app(Dispatcher::class)->dispatch(new DeliverWebhookJob(
            url: $url,
            secret: $secret,
            event: $delivery->event,
            deliveryId: $newDeliveryId,
            payload: $payload,
        ));

        return response()->json([
            'ok' => true,
            'delivery' => $this->transform($retry->fresh() ?? $retry),
            'original_delivery_id' => $delivery->id,
        ], 201);
    }

    /**
     * @return array{
     *     id: string,
     *     event: string,
     *     url: string,
     *     status: string,
     *     http_status: int|null,
     *     attempts: int,
     *     payload: array<string, mixed>|null,
     *     response_body: string|null,
     *     error_message: string|null,
     *     post_id: string|null,
     *     finished_at: string|null,
     *     created_at: string|null,
     *     updated_at: string|null
     * }
     */
    private function transform(WebhookDelivery $delivery): array
    {
        return [
            'id' => $delivery->id,
            'event' => $delivery->event,
            'url' => $delivery->url,
            'status' => $delivery->status->value,
            'http_status' => $delivery->http_status,
            'attempts' => (int) $delivery->attempts,
            'payload' => is_array($delivery->payload) ? $delivery->payload : null,
            'response_body' => $delivery->response_body,
            'error_message' => $delivery->error_message,
            'post_id' => $delivery->post_id,
            'finished_at' => $delivery->finished_at?->toIso8601String(),
            'created_at' => $delivery->created_at?->toIso8601String(),
            'updated_at' => $delivery->updated_at?->toIso8601String(),
        ];
    }
}
