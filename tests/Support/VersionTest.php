<?php

use Canvas\Support\Version;
use Composer\InstalledVersions;

it('returns an empty installed version during tests', function (): void {
    expect(Version::installed())->toBe('');
});

it('returns the installed package version outside unit tests', function (): void {
    app()->offsetSet('env', 'production');

    expect(Version::installed())->toBe(InstalledVersions::getPrettyVersion('austintoddj/canvas'));

    app()->offsetSet('env', 'testing');
});
