<?php

use Canvas\Support\Assets;
use Illuminate\Support\Facades\File;

it('reports assets as up to date during tests', function (): void {
    expect(Assets::isUpToDate())->toBeTrue();
});

it('reports assets as up to date when the hot file is present', function (): void {
    app()->offsetSet('env', 'production');

    File::put(public_path('vendor/canvas/canvas.hot'), 'http://localhost:5173');

    expect(Assets::isUpToDate())->toBeTrue();

    File::delete(public_path('vendor/canvas/canvas.hot'));
    app()->offsetSet('env', 'testing');
});

it('reports assets as not up to date when manifest is missing', function (): void {
    app()->offsetSet('env', 'production');
    File::delete(public_path('vendor/canvas/manifest.json'));

    expect(Assets::isUpToDate())->toBeFalse();

    app()->offsetSet('env', 'testing');
});
