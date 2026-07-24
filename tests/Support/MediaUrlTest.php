<?php

use Canvas\Support\MediaStorage;
use Canvas\Support\MediaUrl;
use Canvas\Support\Paths;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('returns root-relative urls for public disk paths even when APP_URL host is baked into the disk url', function (): void {
    Storage::fake(config('canvas.storage_disk'), [
        'url' => 'http://localhost:8000/storage',
    ]);

    $path = Paths::baseStoragePath().'/photo.jpg';
    Storage::disk(config('canvas.storage_disk'))->put($path, 'image-data');

    expect(MediaUrl::forDiskPath($path))
        ->toBe('/storage/'.$path)
        ->not->toContain('localhost:8000')
        ->not->toContain('http');
});

it('preserves absolute remote disk urls that are not public storage paths', function (): void {
    $remote = 'https://cdn.example.com/canvas/images/photo.jpg';

    expect(MediaUrl::isPublicStorageReference($remote))->toBeFalse()
        ->and(MediaUrl::toStoredMediaReference($remote))->toBe($remote)
        ->and(MediaUrl::absolute($remote))->toBe($remote);
});

it('normalizes absolute public storage urls to root-relative for storage', function (): void {
    expect(MediaUrl::toStoredMediaReference('http://localhost:8000/storage/canvas/images/a.jpg'))
        ->toBe('/storage/canvas/images/a.jpg')
        ->and(MediaUrl::toStoredMediaReference('/storage/canvas/images/a.jpg'))
        ->toBe('/storage/canvas/images/a.jpg')
        ->and(MediaUrl::toStoredMediaReference('https://blog.test/storage/canvas/images/a.jpg?v=1#x'))
        ->toBe('/storage/canvas/images/a.jpg?v=1#x')
        ->and(MediaUrl::toStoredMediaReference('https://images.unsplash.com/photo-1'))
        ->toBe('https://images.unsplash.com/photo-1')
        ->and(MediaUrl::toStoredMediaReference(null))->toBeNull()
        ->and(MediaUrl::toStoredMediaReference(''))->toBeNull()
        ->and(MediaUrl::toStoredMediaReference('   '))->toBeNull();
});

it('detects public storage references', function (): void {
    expect(MediaUrl::isPublicStorageReference('/storage/canvas/images/a.jpg'))->toBeTrue()
        ->and(MediaUrl::isPublicStorageReference('http://localhost:8000/storage/canvas/images/a.jpg'))->toBeTrue()
        ->and(MediaUrl::isPublicStorageReference('https://cdn.example.com/photo.jpg'))->toBeFalse()
        ->and(MediaUrl::isPublicStorageReference('not-a-url'))->toBeFalse()
        ->and(MediaUrl::isPublicStorageReference(null))->toBeFalse();
});

it('expands public storage references to absolute urls using app url', function (): void {
    config(['app.url' => 'http://blog.test']);

    expect(MediaUrl::absolute('/storage/canvas/images/a.jpg'))
        ->toBe('http://blog.test/storage/canvas/images/a.jpg')
        ->and(MediaUrl::absolute('http://localhost:8000/storage/canvas/images/a.jpg', 'https://app.example'))
        ->toBe('https://app.example/storage/canvas/images/a.jpg')
        ->and(MediaUrl::absolute('https://images.unsplash.com/photo-1'))
        ->toBe('https://images.unsplash.com/photo-1')
        ->and(MediaUrl::absolute(null))->toBeNull();
});

it('MediaStorage store returns origin-safe urls under a baked APP_URL disk config', function (): void {
    Storage::fake(config('canvas.storage_disk'), [
        'url' => 'http://localhost:8000/storage',
    ]);

    $file = UploadedFile::fake()->image('photo.jpg', 100, 100);
    $stored = MediaStorage::make()->store($file);

    expect($stored['url'])
        ->toStartWith('/storage/')
        ->not->toContain('localhost:8000');
});
