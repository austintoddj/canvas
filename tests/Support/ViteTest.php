<?php

use Canvas\Support\Vite;
use Illuminate\Foundation\Vite as BaseVite;
use Illuminate\Support\Facades\File;
use Illuminate\Support\HtmlString;

function flushViteManifestCache(): void
{
    $property = new ReflectionProperty(BaseVite::class, 'manifests');
    $property->setAccessible(true);
    $property->setValue(null, []);
}

it('renders vite tags using the canvas build directory', function (): void {
    flushViteManifestCache();

    $html = (string) Vite::tags();

    expect($html)
        ->toContain('vendor/canvas/assets/')
        ->toContain('type="module"');
});

it('returns empty tags when the canvas vite build is unavailable', function (): void {
    flushViteManifestCache();

    $directory = public_path('vendor/canvas');
    $backup = public_path('vendor/canvas-coverage-backup');

    if (File::isDirectory($backup)) {
        File::deleteDirectory($backup);
    }

    File::moveDirectory($directory, $backup);

    try {
        flushViteManifestCache();

        expect((string) Vite::tags())->toBe('');
    } finally {
        if (File::isDirectory($directory)) {
            File::deleteDirectory($directory);
        }
        File::moveDirectory($backup, $directory);
        flushViteManifestCache();
    }
});

it('returns empty react refresh markup when the hot file is absent', function (): void {
    flushViteManifestCache();

    $hot = public_path('vendor/canvas/canvas.hot');
    File::delete($hot);

    $refresh = Vite::reactRefresh();

    expect($refresh === '' || $refresh instanceof HtmlString)->toBeTrue();
});
