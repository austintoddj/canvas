<?php

declare(strict_types=1);

namespace Canvas\Listeners;

use Canvas\Contracts\WebhookEndpointRepository;
use Canvas\Enums\WebhookDeliveryStatus;
use Canvas\Enums\WebhookEvent;
use Canvas\Events\PostDeleted;
use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;
use Canvas\Jobs\DeliverWebhookJob;
use Canvas\Models\WebhookDelivery;
use Canvas\Support\WebhookPayload;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Support\Str;

final class DispatchOutboundWebhooks
{
    public function __construct(
        private readonly WebhookEndpointRepository $endpoints,
        private readonly Dispatcher $bus,
    ) {}

    public function handle(PostPublished|PostScheduled|PostUpdated|PostUnpublished|PostDeleted $event): void
    {
        $webhookEvent = WebhookEvent::fromDomainEvent($event);

        if ($webhookEvent === null) {
            return;
        }

        $endpoints = $this->endpoints->enabledFor($webhookEvent);

        if ($endpoints === []) {
            return;
        }

        $post = $event->post;

        foreach ($endpoints as $endpoint) {
            $deliveryId = (string) Str::uuid();
            $payload = WebhookPayload::forPost($webhookEvent, $post, $deliveryId);

            WebhookDelivery::query()->create([
                'id' => $deliveryId,
                'event' => $webhookEvent->value,
                'url' => $endpoint->url,
                'status' => WebhookDeliveryStatus::Pending,
                'attempts' => 0,
                'payload' => WebhookDelivery::capPayload($payload),
                'post_id' => $post->id,
            ]);

            $this->bus->dispatch(new DeliverWebhookJob(
                url: $endpoint->url,
                secret: $endpoint->secret,
                event: $webhookEvent->value,
                deliveryId: $deliveryId,
                payload: $payload,
            ));
        }
    }
}
