<?php

use Canvas\Support\WebhookSigner;

it('builds a stripe-style t and v1 signature header', function (): void {
    $secret = 'whsec_test_secret';
    $body = '{"api_version":1,"event":"post.published"}';
    $timestamp = 1_721_657_645;

    $header = WebhookSigner::sign($secret, $body, $timestamp);

    $expectedDigest = hash_hmac('sha256', $timestamp.'.'.$body, $secret);

    expect($header)->toBe("t={$timestamp},v1={$expectedDigest}");
});

it('verifies a valid signature within the tolerance window', function (): void {
    $secret = 'whsec_test_secret';
    $body = '{"ok":true}';
    $timestamp = 1_721_657_645;
    $header = WebhookSigner::sign($secret, $body, $timestamp);

    expect(WebhookSigner::verify($secret, $body, $header, toleranceSeconds: 300, now: $timestamp))->toBeTrue()
        ->and(WebhookSigner::verify($secret, $body, $header, toleranceSeconds: 300, now: $timestamp + 10))->toBeTrue();
});

it('rejects tampered bodies, wrong secrets, and expired timestamps', function (): void {
    $secret = 'whsec_test_secret';
    $body = '{"ok":true}';
    $timestamp = 1_721_657_645;
    $header = WebhookSigner::sign($secret, $body, $timestamp);

    expect(WebhookSigner::verify($secret, '{"ok":false}', $header, now: $timestamp))->toBeFalse()
        ->and(WebhookSigner::verify('other-secret', $body, $header, now: $timestamp))->toBeFalse()
        ->and(WebhookSigner::verify($secret, $body, $header, toleranceSeconds: 30, now: $timestamp + 120))->toBeFalse()
        ->and(WebhookSigner::verify($secret, $body, 'not-a-header', now: $timestamp))->toBeFalse();
});
