<?php

use Canvas\Support\Paths;

it('returns the base path', function (): void {
    expect(Paths::basePath())->toBe('/'.config('canvas.path'));
});

it('returns the base storage path', function (): void {
    expect(Paths::baseStoragePath())->toBe(config('canvas.storage_path').'/images');
});
