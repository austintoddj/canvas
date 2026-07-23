<?php

declare(strict_types=1);

namespace Canvas\Listeners;

use Canvas\Contracts\WebhookEndpointRepository;
use Canvas\Enums\WebhookEvent;
use Canvas\Events\PostDeleted;
use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;
use Canvas\Jobs\DeliverWebhookJob;
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
        $deliveryId = (string) Str::uuid();
        $payload = WebhookPayload::forPost($webhookEvent, $post, $deliveryId);

        foreach ($endpoints as $endpoint) {
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
