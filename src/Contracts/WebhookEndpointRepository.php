<?php

declare(strict_types=1);

namespace Canvas\Contracts;

use Canvas\Enums\WebhookEvent;
use Canvas\Support\WebhookEndpoint;

interface WebhookEndpointRepository
{
    /**
     * Endpoints that should receive the given event.
     *
     * @return list<WebhookEndpoint>
     */
    public function enabledFor(WebhookEvent $event): array;
}
