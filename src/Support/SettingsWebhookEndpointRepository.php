<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Contracts\WebhookEndpointRepository;
use Canvas\Enums\WebhookEvent;

/**
 * v1: single endpoint from canvas_settings.
 * Multi-endpoint can implement the same contract later.
 */
final class SettingsWebhookEndpointRepository implements WebhookEndpointRepository
{
    public function enabledFor(WebhookEvent $event): array
    {
        if (! Webhooks::configured() || ! Webhooks::subscribesTo($event)) {
            return [];
        }

        $url = Webhooks::url();
        $secret = Webhooks::secret();

        if ($url === null || $secret === null) {
            return [];
        }

        if (! WebhookUrlValidator::isAllowed($url)) {
            return [];
        }

        return [new WebhookEndpoint($url, $secret)];
    }
}
