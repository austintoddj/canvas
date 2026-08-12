<?php

use Canvas\Support\WebhookUrlValidator;

it('allows https urls with public hosts', function (): void {
    expect(WebhookUrlValidator::isAllowed('https://example.com/hooks/canvas'))->toBeTrue()
        ->and(WebhookUrlValidator::isAllowed('https://example.com/hooks/canvas?x=1'))->toBeTrue();
});

it('rejects non-https schemes and malformed urls', function (string $url): void {
    expect(WebhookUrlValidator::isAllowed($url))->toBeFalse();
})->with([
    'http' => 'http://example.com/hooks',
    'ftp' => 'ftp://example.com/hooks',
    'empty' => '',
    'not a url' => 'not-a-url',
    'missing host' => 'https:///path',
    'credentials' => 'https://user:pass@example.com/hooks',
]);

it('rejects private and reserved ip targets', function (string $url): void {
    expect(WebhookUrlValidator::isAllowed($url))->toBeFalse();
})->with([
    'loopback' => 'https://127.0.0.1/hooks',
    'private 10' => 'https://10.0.0.5/hooks',
    'private 192' => 'https://192.168.1.10/hooks',
    'link local' => 'https://169.254.169.254/hooks',
    'localhost name' => 'https://localhost/hooks',
]);

// Regression: GHSA-5fp8-rp48-gr3c — IPv6 transition forms that embed private IPv4
// must not bypass FILTER_FLAG_NO_PRIV_RANGE / FILTER_FLAG_NO_RES_RANGE.
it('rejects ipv6 transition and special-use addresses that bypass priv/res flags', function (string $url): void {
    expect(WebhookUrlValidator::isAllowed($url))->toBeFalse();
})->with([
    '6to4 private 192.168.1.1' => 'https://[2002:c0a8:0101::]/callback',
    '6to4 loopback 127.0.0.1' => 'https://[2002:7f00:0001::]/callback',
    '6to4 link-local metadata' => 'https://[2002:a9fe:a9fe::]/callback',
    '6to4 public-looking embed' => 'https://[2002:0808:0808::]/callback',
    'nat64 private 192.168.1.1' => 'https://[64:ff9b::c0a8:0101]/callback',
    'nat64 link-local metadata' => 'https://[64:ff9b::a9fe:a9fe]/callback',
    'nat64 public-looking embed' => 'https://[64:ff9b::0808:0808]/callback',
    'ipv4-mapped private' => 'https://[::ffff:192.168.1.1]/callback',
    'ipv4-mapped loopback' => 'https://[::ffff:127.0.0.1]/callback',
    'ipv4-compatible private' => 'https://[::c0a8:0101]/callback',
    'teredo' => 'https://[2001:0:0:0:0:0:0:1]/callback',
    'documentation' => 'https://[2001:db8::1]/callback',
    'discard-only' => 'https://[100::1]/callback',
    'site-local' => 'https://[fec0::1]/callback',
]);

it('allows public ipv4-mapped ipv6 literals', function (): void {
    expect(WebhookUrlValidator::isAllowed('https://[::ffff:8.8.8.8]/hooks'))->toBeTrue();
});

it('allows public global ipv6 literals', function (): void {
    expect(WebhookUrlValidator::isAllowed('https://[2001:4860:4860::8888]/hooks'))->toBeTrue();
});

it('rejects hosts that do not resolve in dns', function (): void {
    expect(WebhookUrlValidator::isAllowed(
        'https://this-host-definitely-does-not-exist-canvas-webhook-test.invalid/hooks',
    ))->toBeFalse();
});

it('rejects urls longer than the max length', function (): void {
    $url = 'https://example.com/'.str_repeat('a', 2100);

    expect(WebhookUrlValidator::isAllowed($url))->toBeFalse();
});
