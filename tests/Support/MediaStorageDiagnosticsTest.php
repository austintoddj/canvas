<?php

use Canvas\Support\MediaStorageDiagnostics;

it('flags private local disks that cannot serve unsigned media urls', function (): void {
    expect(MediaStorageDiagnostics::diskIsPrivateLocal([
        'driver' => 'local',
        'root' => storage_path('app/private'),
        'serve' => true,
    ]))->toBeTrue();
});

it('does not flag public disks', function (): void {
    expect(MediaStorageDiagnostics::diskIsPrivateLocal([
        'driver' => 'local',
        'root' => storage_path('app/public'),
        'url' => 'http://localhost/storage',
        'visibility' => 'public',
    ]))->toBeFalse();
});

it('warns when the configured canvas disk is private local', function (): void {
    config([
        'canvas.storage_disk' => 'local',
        'filesystems.disks.local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
        ],
    ]);

    $warnings = MediaStorageDiagnostics::warnings();

    expect($warnings)->not->toBeEmpty()
        ->and($warnings[0])->toContain('private local disk')
        ->and($warnings[0])->toContain('CANVAS_STORAGE_DISK=public');
});

it('warns when the public storage symlink is missing', function (): void {
    config([
        'canvas.storage_disk' => 'public',
        'filesystems.disks.public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => 'http://localhost/storage',
            'visibility' => 'public',
        ],
    ]);

    $link = public_path('storage');

    if (is_link($link) || is_dir($link)) {
        // Testbench environments usually have no symlink; if one exists, skip this case.
        expect(MediaStorageDiagnostics::storageLinkExists())->toBeTrue();

        return;
    }

    $warnings = MediaStorageDiagnostics::warnings();

    expect(collect($warnings)->first(
        fn (string $warning): bool => str_contains($warning, 'storage:link')
    ))->not->toBeNull();
});

it('warns when the configured disk does not exist', function (): void {
    config([
        'canvas.storage_disk' => 'missing-disk',
        'filesystems.disks.missing-disk' => null,
    ]);

    // Ensure the disk key is truly absent.
    $disks = config('filesystems.disks', []);
    unset($disks['missing-disk']);
    config(['filesystems.disks' => $disks]);

    $warnings = MediaStorageDiagnostics::warnings();

    expect($warnings)->not->toBeEmpty()
        ->and($warnings[0])->toContain('missing-disk');
});

it('does not treat non-local drivers as private local disks', function (): void {
    expect(MediaStorageDiagnostics::diskIsPrivateLocal([
        'driver' => 's3',
        'bucket' => 'canvas',
    ]))->toBeFalse();
});

it('does not treat local disks with a public url as private', function (): void {
    expect(MediaStorageDiagnostics::diskIsPrivateLocal([
        'driver' => 'local',
        'root' => storage_path('app/custom'),
        'url' => 'http://localhost/media',
    ]))->toBeFalse();
});

it('detects custom disks whose url path expects a storage symlink', function (): void {
    expect(MediaStorageDiagnostics::diskExpectsStorageLink('custom', [
        'driver' => 'local',
        'url' => 'http://localhost/storage/canvas',
    ]))->toBeTrue();

    expect(MediaStorageDiagnostics::diskExpectsStorageLink('custom', [
        'driver' => 'local',
        'url' => 'http://cdn.example.com/media',
    ]))->toBeFalse();

    expect(MediaStorageDiagnostics::diskExpectsStorageLink('custom', [
        'driver' => 'local',
        'url' => '',
    ]))->toBeFalse();
});
