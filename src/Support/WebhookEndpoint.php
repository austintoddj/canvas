<?php

declare(strict_types=1);

namespace Canvas\Support;

final readonly class WebhookEndpoint
{
    public function __construct(
        public string $url,
        public string $secret,
    ) {}
}
