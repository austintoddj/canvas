<?php

use Canvas\Support\Referer;

it('parses the referer host', function (): void {
    expect(Referer::host('https://www.example.com'))->toBe('www.example.com');
    expect(Referer::host(null))->toBeNull();
    expect(Referer::host('://www.example.c'))->toBeNull();
});
