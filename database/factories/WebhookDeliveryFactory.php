<?php

namespace Canvas\Database\Factories;

use Canvas\Enums\WebhookDeliveryStatus;
use Canvas\Enums\WebhookEvent;
use Canvas\Models\WebhookDelivery;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<WebhookDelivery>
 */
class WebhookDeliveryFactory extends Factory
{
    protected $model = WebhookDelivery::class;

    public function definition(): array
    {
        $deliveryId = (string) Str::orderedUuid();

        return [
            'id' => $deliveryId,
            'event' => WebhookEvent::PostPublished->value,
            'url' => 'https://example.com/hooks/canvas',
            'status' => WebhookDeliveryStatus::Pending,
            'http_status' => null,
            'attempts' => 0,
            'payload' => [
                'api_version' => 1,
                'event' => WebhookEvent::PostPublished->value,
                'delivery_id' => $deliveryId,
                'created_at' => now()->toIso8601String(),
                'data' => [
                    'id' => (string) Str::orderedUuid(),
                    'title' => 'Example',
                ],
            ],
            'response_body' => null,
            'error_message' => null,
            'post_id' => null,
            'finished_at' => null,
        ];
    }

    public function success(): static
    {
        return $this->state(fn (): array => [
            'status' => WebhookDeliveryStatus::Success,
            'http_status' => 200,
            'attempts' => 1,
            'response_body' => '{"ok":true}',
            'finished_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (): array => [
            'status' => WebhookDeliveryStatus::Failed,
            'http_status' => 500,
            'attempts' => 3,
            'error_message' => 'Canvas webhook delivery failed with HTTP 500.',
            'response_body' => 'Internal Server Error',
            'finished_at' => now(),
        ]);
    }
}
