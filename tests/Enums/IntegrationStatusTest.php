<?php

declare(strict_types=1);

use Canvas\Enums\IntegrationStatus;

it('exposes the durable connection statuses', function (): void {
    expect(IntegrationStatus::values())->toBe(['off', 'enabled'])
        ->and(IntegrationStatus::Off->value)->toBe('off')
        ->and(IntegrationStatus::Enabled->value)->toBe('enabled');
});
