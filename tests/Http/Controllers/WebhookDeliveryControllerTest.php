<?php

use Canvas\Enums\WebhookDeliveryStatus;
use Canvas\Jobs\DeliverWebhookJob;
use Canvas\Models\WebhookDelivery;
use Illuminate\Support\Facades\Bus;

it('lists recent webhook deliveries for admins', function (): void {
    $older = WebhookDelivery::factory()->success()->create([
        'event' => 'post.updated',
        'created_at' => now()->subHour(),
    ]);
    $newer = WebhookDelivery::factory()->failed()->create([
        'event' => 'post.published',
        'created_at' => now(),
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/integrations/webhooks/deliveries')
        ->assertSuccessful()
        ->assertJsonPath('data.0.id', $newer->id)
        ->assertJsonPath('data.1.id', $older->id)
        ->assertJsonMissing(['whsec_test_secret', 'secret']);
});

it('filters deliveries by event', function (): void {
    WebhookDelivery::factory()->success()->create(['event' => 'post.published']);
    $updated = WebhookDelivery::factory()->failed()->create(['event' => 'post.updated']);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/integrations/webhooks/deliveries?event=post.updated')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $updated->id)
        ->assertJsonPath('data.0.event', 'post.updated');
});

it('filters deliveries by status', function (): void {
    WebhookDelivery::factory()->success()->create();
    $failed = WebhookDelivery::factory()->failed()->create();

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/integrations/webhooks/deliveries?status=failed')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $failed->id)
        ->assertJsonPath('data.0.status', 'failed');
});

it('shows a single delivery without secrets', function (): void {
    $delivery = WebhookDelivery::factory()->failed()->create([
        'error_message' => 'HTTP 500',
        'response_body' => 'nope',
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/integrations/webhooks/deliveries/{$delivery->id}")
        ->assertSuccessful()
        ->assertJsonPath('id', $delivery->id)
        ->assertJsonPath('error_message', 'HTTP 500')
        ->assertJsonPath('response_body', 'nope')
        ->assertJsonMissing(['whsec_test_secret']);
});

it('forbids non-admins from delivery history', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->getJson('canvas/api/integrations/webhooks/deliveries')
        ->assertForbidden();
});

it('retries a failed delivery with a new id and keeps the original row', function (): void {
    Bus::fake([DeliverWebhookJob::class]);
    configureWebhooks();

    $original = WebhookDelivery::factory()->failed()->create([
        'event' => 'post.published',
        'payload' => [
            'api_version' => 1,
            'event' => 'post.published',
            'delivery_id' => 'original-id',
            'created_at' => now()->subMinute()->toIso8601String(),
            'data' => ['id' => 'post-1', 'title' => 'Hello'],
        ],
        'post_id' => null,
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/integrations/webhooks/deliveries/{$original->id}/retry")
        ->assertCreated()
        ->assertJsonPath('ok', true)
        ->assertJsonPath('original_delivery_id', $original->id);

    $newId = $response->json('delivery.id');

    expect($newId)->toBeString()->not->toBe($original->id)
        ->and(WebhookDelivery::query()->find($original->id))->not->toBeNull()
        ->and(WebhookDelivery::query()->find($newId)?->status)->toBe(WebhookDeliveryStatus::Pending);

    Bus::assertDispatched(DeliverWebhookJob::class, function (DeliverWebhookJob $job) use ($newId): bool {
        return $job->deliveryId === $newId
            && $job->event === 'post.published'
            && ($job->payload['delivery_id'] ?? null) === $newId
            && $job->secret === 'whsec_test_secret';
    });

    $original->refresh();
    expect($original->status)->toBe(WebhookDeliveryStatus::Failed);
});

it('rejects retry for successful deliveries', function (): void {
    configureWebhooks();
    $delivery = WebhookDelivery::factory()->success()->create();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/integrations/webhooks/deliveries/{$delivery->id}/retry")
        ->assertStatus(422)
        ->assertJsonPath('code', 'webhooks_delivery_not_failed');
});

it('rejects retry when webhooks are not configured', function (): void {
    $delivery = WebhookDelivery::factory()->failed()->create();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/integrations/webhooks/deliveries/{$delivery->id}/retry")
        ->assertStatus(422)
        ->assertJsonPath('code', 'webhooks_not_configured');
});
