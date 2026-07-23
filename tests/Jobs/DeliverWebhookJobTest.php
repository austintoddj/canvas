<?php

use Canvas\Jobs\DeliverWebhookJob;
use Canvas\Support\WebhookSigner;
use Illuminate\Support\Facades\Http;

it('posts a signed json envelope to the endpoint', function (): void {
    Http::fake([
        'https://example.com/*' => Http::response(['received' => true], 200),
    ]);

    $payload = [
        'api_version' => 1,
        'event' => 'post.published',
        'delivery_id' => 'del-1',
        'created_at' => '2026-07-22T15:04:05+00:00',
        'data' => ['id' => 'post-1', 'title' => 'Hello'],
    ];

    $job = new DeliverWebhookJob(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: 'del-1',
        payload: $payload,
    );

    $job->handle();

    Http::assertSent(function ($request) use ($payload): bool {
        if ($request->url() !== 'https://example.com/hooks/canvas') {
            return false;
        }

        if ($request->method() !== 'POST') {
            return false;
        }

        $eventHeader = $request->header('Canvas-Event')[0] ?? null;
        $deliveryHeader = $request->header('Canvas-Delivery-Id')[0] ?? null;
        $userAgent = $request->header('User-Agent')[0] ?? null;
        $signature = $request->header('Canvas-Signature')[0] ?? '';
        $body = $request->body();

        if ($eventHeader !== 'post.published' || $deliveryHeader !== 'del-1' || $userAgent !== 'Canvas-Webhooks/1.0') {
            return false;
        }

        if (json_decode($body, true) !== $payload) {
            return false;
        }

        if (str_contains($body, '"body"')) {
            return false;
        }

        return WebhookSigner::verify('whsec_test_secret', $body, $signature, now: time());
    });
});

it('retries by throwing when the endpoint returns a non-success status', function (): void {
    Http::fake([
        'https://example.com/*' => Http::response('nope', 500),
    ]);

    $job = new DeliverWebhookJob(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: 'del-2',
        payload: ['api_version' => 1, 'event' => 'post.published', 'data' => []],
    );

    expect(fn () => $job->handle())->toThrow(RuntimeException::class);
});

it('skips delivery when the url is not allowed', function (): void {
    Http::fake();

    $job = new DeliverWebhookJob(
        url: 'https://127.0.0.1/hooks',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: 'del-3',
        payload: ['api_version' => 1, 'event' => 'post.published', 'data' => []],
    );

    $job->handle();

    Http::assertNothingSent();
});
