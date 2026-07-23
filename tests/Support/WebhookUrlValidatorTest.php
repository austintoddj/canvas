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
