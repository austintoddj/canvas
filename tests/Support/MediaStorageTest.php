<?php

use Canvas\Support\MediaStorage;
use Canvas\Support\Paths;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    Storage::fake(config('canvas.storage_disk'));
});

it('stores a file and returns metadata', function (): void {
    $file = UploadedFile::fake()->image('photo.jpg', 640, 480);
    $storage = MediaStorage::make();

    $stored = $storage->store($file);

    expect($stored['path'])->toStartWith(Paths::baseStoragePath().'/')
        ->and($stored['filename'])->toBe($file->hashName())
        ->and($stored['original_name'])->toBe('photo.jpg')
        ->and($stored['mime_type'])->toBe('image/jpeg')
        ->and($stored['size'])->toBeGreaterThan(0)
        ->and($stored['width'])->toBe(640)
        ->and($stored['height'])->toBe(480)
        ->and($stored['url'])->toBe($storage->url($stored['path']));

    Storage::disk(config('canvas.storage_disk'))->assertExists($stored['path']);
});

it('deletes a stored file', function (): void {
    $file = UploadedFile::fake()->image('photo.jpg');
    $storage = MediaStorage::make();
    $stored = $storage->store($file);

    $storage->delete($stored['path']);

    Storage::disk(config('canvas.storage_disk'))->assertMissing($stored['path']);
});

it('validates upload paths', function (): void {
    $storage = MediaStorage::make();

    expect($storage->isValidPath(Paths::baseStoragePath().'/photo.jpg'))->toBeTrue()
        ->and($storage->isValidPath('../../../etc/passwd'))->toBeFalse();
});
