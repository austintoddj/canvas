<?php

use Canvas\Models\WebhookDelivery;

it('prunes webhook deliveries older than the retention window', function (): void {
    $old = WebhookDelivery::factory()->success()->create([
        'created_at' => now()->subDays(45),
        'updated_at' => now()->subDays(45),
    ]);
    $recent = WebhookDelivery::factory()->failed()->create([
        'created_at' => now()->subDays(5),
        'updated_at' => now()->subDays(5),
    ]);

    $this->artisan('canvas:prune-webhook-deliveries', ['--days' => 30])
        ->assertSuccessful()
        ->expectsOutputToContain('Deleted 1 webhook delivery row');

    expect(WebhookDelivery::query()->find($old->id))->toBeNull()
        ->and(WebhookDelivery::query()->find($recent->id))->not->toBeNull();
});

it('defaults to a thirty day retention window', function (): void {
    WebhookDelivery::factory()->create([
        'created_at' => now()->subDays(31),
        'updated_at' => now()->subDays(31),
    ]);
    WebhookDelivery::factory()->create([
        'created_at' => now()->subDays(10),
        'updated_at' => now()->subDays(10),
    ]);

    $this->artisan('canvas:prune-webhook-deliveries')->assertSuccessful();

    expect(WebhookDelivery::query()->count())->toBe(1);
});
