<?php

use Canvas\Support\DnsHostResolver;

// Regression: GHSA-2v46-cgmc-v9xr — lookup returns both A and AAAA addresses.
it('collects ipv4 and ipv6 addresses from dns records', function (): void {
    $resolver = new class extends DnsHostResolver
    {
        protected function dnsRecords(string $host): array|false
        {
            return [
                ['type' => 'A', 'ip' => '8.8.8.8'],
                ['type' => 'AAAA', 'ipv6' => '2001:4860:4860::8888'],
                ['type' => 'A', 'ip' => '8.8.8.8'],
                'skip',
                ['ip' => ''],
            ];
        }
    };

    expect($resolver->resolve('example.com'))->toBe([
        '8.8.8.8',
        '2001:4860:4860::8888',
    ]);
});

// Regression: GHSA-2v46-cgmc-v9xr — a failed record lookup falls back to A records.
it('falls back to ipv4 lookup when dns records are unavailable', function (): void {
    $resolver = new class extends DnsHostResolver
    {
        protected function dnsRecords(string $host): array|false
        {
            return false;
        }
    };

    expect($resolver->resolve('localhost'))->toContain('127.0.0.1')
        ->and($resolver->resolve('this-host-definitely-does-not-exist-canvas-webhook-test.invalid'))->toBe([]);
});

// Regression: GHSA-2v46-cgmc-v9xr — a lookup with no answers yields nothing.
it('returns no addresses when dns has no records', function (): void {
    expect((new DnsHostResolver)->resolve(
        'this-host-definitely-does-not-exist-canvas-webhook-test.invalid',
    ))->toBe([]);
});

// Regression: GHSA-2v46-cgmc-v9xr — a failed lookup does not throw.
it('returns no addresses when the hostname cannot be queried', function (): void {
    expect((new DnsHostResolver)->resolve("\0"))->toBe([]);
});
