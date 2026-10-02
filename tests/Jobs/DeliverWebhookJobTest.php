<?php

use Canvas\Contracts\HostResolver;
use Canvas\Enums\WebhookDeliveryStatus;
use Canvas\Jobs\DeliverWebhookJob;
use Canvas\Models\WebhookDelivery;
use Canvas\Support\WebhookSigner;
use Canvas\Tests\Support\FakeHostResolver;
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

it('marks a delivery row successful after a 2xx response', function (): void {
    Http::fake([
        'https://example.com/*' => Http::response(['ok' => true], 200),
    ]);

    $delivery = WebhookDelivery::factory()->create([
        'id' => 'del-success',
        'status' => WebhookDeliveryStatus::Pending,
        'attempts' => 0,
    ]);

    $job = new DeliverWebhookJob(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: $delivery->id,
        payload: ['api_version' => 1, 'event' => 'post.published', 'delivery_id' => $delivery->id, 'data' => []],
    );

    $job->handle();

    $delivery->refresh();

    expect($delivery->status)->toBe(WebhookDeliveryStatus::Success)
        ->and($delivery->http_status)->toBe(200)
        ->and($delivery->attempts)->toBe(1)
        ->and($delivery->finished_at)->not->toBeNull()
        ->and($delivery->response_body)->toContain('ok');
});

it('records attempt details when the remote returns non-2xx', function (): void {
    Http::fake([
        'https://example.com/*' => Http::response('boom', 502),
    ]);

    $delivery = WebhookDelivery::factory()->create([
        'id' => 'del-fail-attempt',
        'status' => WebhookDeliveryStatus::Pending,
        'attempts' => 0,
    ]);

    $job = new DeliverWebhookJob(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: $delivery->id,
        payload: ['api_version' => 1, 'event' => 'post.published', 'delivery_id' => $delivery->id, 'data' => []],
    );

    expect(fn () => $job->handle())->toThrow(RuntimeException::class);

    $delivery->refresh();

    expect($delivery->status)->toBe(WebhookDeliveryStatus::Pending)
        ->and($delivery->http_status)->toBe(502)
        ->and($delivery->attempts)->toBe(1)
        ->and($delivery->response_body)->toBe('boom')
        ->and($delivery->error_message)->toContain('502');
});

it('marks the delivery failed from the job failed hook', function (): void {
    $delivery = WebhookDelivery::factory()->create([
        'id' => 'del-final-fail',
        'status' => WebhookDeliveryStatus::Pending,
        'http_status' => 500,
        'error_message' => 'temporary',
        'attempts' => 3,
    ]);

    $job = new DeliverWebhookJob(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: $delivery->id,
        payload: ['api_version' => 1, 'event' => 'post.published', 'data' => []],
    );

    $job->failed(new RuntimeException('final failure'));

    $delivery->refresh();

    expect($delivery->status)->toBe(WebhookDeliveryStatus::Failed)
        ->and($delivery->error_message)->toBe('final failure')
        ->and($delivery->finished_at)->not->toBeNull();
});

it('marks disallowed urls as failed without sending', function (): void {
    Http::fake();

    $delivery = WebhookDelivery::factory()->create([
        'id' => 'del-blocked',
        'status' => WebhookDeliveryStatus::Pending,
        'url' => 'https://127.0.0.1/hooks',
    ]);

    $job = new DeliverWebhookJob(
        url: 'https://127.0.0.1/hooks',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: $delivery->id,
        payload: ['api_version' => 1, 'event' => 'post.published', 'data' => []],
    );

    $job->handle();

    Http::assertNothingSent();

    $delivery->refresh();

    expect($delivery->status)->toBe(WebhookDeliveryStatus::Failed)
        ->and($delivery->attempts)->toBe(1)
        ->and($delivery->error_message)->toBe('Webhook URL is not allowed.');
});

// Regression: GHSA-2v46-cgmc-v9xr — the connection is pinned to the first validated address.
it('pins delivery to the first validated address and resolves once per attempt', function (): void {
    $optionsSent = null;

    Http::fake(function ($request, array $options) use (&$optionsSent) {
        $optionsSent = $options;

        return Http::response(['ok' => true], 200);
    });

    $resolver = new FakeHostResolver([
        ['8.8.8.8'],
        ['127.0.0.1'],
    ]);
    app()->instance(HostResolver::class, $resolver);

    $delivery = WebhookDelivery::factory()->create([
        'id' => 'del-pinned',
        'status' => WebhookDeliveryStatus::Pending,
        'attempts' => 0,
    ]);

    $job = new DeliverWebhookJob(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: $delivery->id,
        payload: ['api_version' => 1, 'event' => 'post.published', 'delivery_id' => $delivery->id, 'data' => []],
    );

    $job->handle();

    expect($resolver->calls)->toBe(1);

    Http::assertSent(fn ($request): bool => $request->url() === 'https://example.com/hooks/canvas');

    expect($optionsSent['curl'][CURLOPT_RESOLVE] ?? null)->toBe(['example.com:443:8.8.8.8'])
        ->and($optionsSent['curl'][CURLOPT_PROTOCOLS] ?? null)->toBe(CURLPROTO_HTTPS)
        ->and($optionsSent['allow_redirects'] ?? null)->toBeFalse();

    $delivery->refresh();

    expect($delivery->status)->toBe(WebhookDeliveryStatus::Success);
});

// Regression: GHSA-2v46-cgmc-v9xr — IPv6 pins are bracketed for curl.
it('brackets ipv6 addresses in the resolve pin', function (): void {
    $options = DeliverWebhookJob::curlOptions([
        'host' => 'example.com',
        'port' => 8443,
        'ips' => ['2001:4860:4860::8888'],
    ]);

    expect($options[CURLOPT_RESOLVE] ?? null)->toBe(['example.com:8443:[2001:4860:4860::8888]'])
        ->and(DeliverWebhookJob::curlOptions([
            'host' => 'example.com',
            'port' => 443,
            'ips' => [],
        ]))->toBeNull();
});

// Regression: GHSA-2v46-cgmc-v9xr — literal addresses do not need a resolve pin.
it('does not pin ip literal urls', function (): void {
    $curl = null;

    Http::fake(function ($request, array $options) use (&$curl) {
        $curl = $options['curl'] ?? null;

        return Http::response(['ok' => true], 200);
    });

    $job = new DeliverWebhookJob(
        url: 'https://8.8.8.8/hooks',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: 'del-literal',
        payload: ['api_version' => 1, 'event' => 'post.published', 'data' => []],
    );

    $job->handle();

    Http::assertSent(fn ($request): bool => $request->url() === 'https://8.8.8.8/hooks');

    expect($curl)->not->toHaveKey(CURLOPT_RESOLVE)
        ->and($curl[CURLOPT_PROTOCOLS] ?? null)->toBe(CURLPROTO_HTTPS);
});

// Regression: GHSA-2v46-cgmc-v9xr — hostname delivery fails closed without curl.
it('fails closed when curl cannot pin a hostname', function (): void {
    Http::fake();

    DeliverWebhookJob::fakeCurlAvailability(false);

    $delivery = WebhookDelivery::factory()->create([
        'id' => 'del-no-curl',
        'status' => WebhookDeliveryStatus::Pending,
        'attempts' => 0,
    ]);

    $job = new DeliverWebhookJob(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: $delivery->id,
        payload: ['api_version' => 1, 'event' => 'post.published', 'data' => []],
    );

    try {
        expect(DeliverWebhookJob::curlOptions([
            'host' => 'example.com',
            'port' => 443,
            'ips' => ['8.8.8.8'],
        ]))->toBeNull()
            ->and(DeliverWebhookJob::curlOptions([
                'host' => '8.8.8.8',
                'port' => 443,
                'ips' => ['8.8.8.8'],
            ]))->toBe([]);

        $job->handle();
    } finally {
        DeliverWebhookJob::fakeCurlAvailability(null);
    }

    Http::assertNothingSent();

    $delivery->refresh();

    expect($delivery->status)->toBe(WebhookDeliveryStatus::Failed)
        ->and($delivery->error_message)->toBe('Webhook delivery requires the PHP curl extension.')
        ->and($delivery->attempts)->toBe(1);
});

it('treats redirect responses as a failed delivery without following them', function (): void {
    Http::fake([
        'https://example.com/hooks/canvas' => Http::response('moved', 302, [
            'Location' => 'https://example.com/elsewhere',
        ]),
        'https://example.com/elsewhere' => Http::response('ok', 200),
    ]);

    $delivery = WebhookDelivery::factory()->create([
        'id' => 'del-redirect',
        'status' => WebhookDeliveryStatus::Pending,
        'attempts' => 0,
    ]);

    $job = new DeliverWebhookJob(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: $delivery->id,
        payload: ['api_version' => 1, 'event' => 'post.published', 'delivery_id' => $delivery->id, 'data' => []],
    );

    expect(fn () => $job->handle())->toThrow(RuntimeException::class);

    Http::assertSent(fn ($request): bool => $request->url() === 'https://example.com/hooks/canvas');
    Http::assertNotSent(fn ($request): bool => $request->url() === 'https://example.com/elsewhere');

    $delivery->refresh();

    expect($delivery->status)->toBe(WebhookDeliveryStatus::Pending)
        ->and($delivery->http_status)->toBe(302)
        ->and($delivery->error_message)->toContain('302');
});

it('caps stored error messages to the column length', function (): void {
    $delivery = WebhookDelivery::factory()->create([
        'id' => 'del-long-error',
        'status' => WebhookDeliveryStatus::Pending,
    ]);

    $job = new DeliverWebhookJob(
        url: 'https://example.com/hooks/canvas',
        secret: 'whsec_test_secret',
        event: 'post.published',
        deliveryId: $delivery->id,
        payload: ['api_version' => 1, 'event' => 'post.published', 'data' => []],
    );

    $job->failed(new RuntimeException(str_repeat('x', 400)));

    expect(mb_strlen((string) $delivery->refresh()->error_message))->toBe(WebhookDelivery::MAX_ERROR_CHARS);
});
