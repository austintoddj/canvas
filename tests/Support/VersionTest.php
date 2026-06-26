<?php

use Canvas\Support\Version;

it('returns an empty installed version during tests', function (): void {
    expect(Version::installed())->toBe('');
});
