<?php

use Canvas\Models\Media;
use Canvas\Support\MediaUrl;
use Canvas\Support\Paths;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    Storage::fake(config('canvas.storage_disk'));
});

it('defines the user relationship', function (): void {
    $media = Media::factory()->create();

    expect($media->user())->toBeInstanceOf(BelongsTo::class)
        ->and($media->user)->toBeInstanceOf(User::class);
});

it('generates a url from the stored path', function (): void {
    $path = Paths::baseStoragePath().'/example.jpg';

    Storage::disk(config('canvas.storage_disk'))->put($path, 'image-data');

    $media = Media::factory()->create(['path' => $path]);

    expect($media->url)->toBe(MediaUrl::forDiskPath($path))
        ->and($media->url)->toStartWith('/storage/');
});

it('returns root-relative media urls when the disk url includes APP_URL', function (): void {
    Storage::fake(config('canvas.storage_disk'), [
        'url' => 'http://localhost:8000/storage',
    ]);

    $path = Paths::baseStoragePath().'/example.jpg';
    Storage::disk(config('canvas.storage_disk'))->put($path, 'image-data');

    $media = Media::factory()->create(['path' => $path]);

    expect($media->url)
        ->toBe('/storage/'.$path)
        ->not->toContain('localhost:8000');
});

it('resolves the media type from the mime type', function (): void {
    $media = Media::factory()->create(['mime_type' => 'image/jpeg']);

    expect($media->type)->toBe('image');
});

it('scopes media to a specific owner', function (): void {
    $owned = Media::factory()->create(['user_id' => $this->admin->id]);
    Media::factory()->create(['user_id' => $this->editor->id]);

    $results = Media::query()->ownedBy($this->admin)->get();

    expect($results)->toHaveCount(1)
        ->and($results->first()->is($owned))->toBeTrue();
});

it('scopes media by search term', function (): void {
    Media::factory()->create(['original_name' => 'sunset-beach.jpg']);
    Media::factory()->create(['original_name' => 'mountain-view.jpg']);

    $results = Media::query()->search('sunset')->get();

    expect($results)->toHaveCount(1)
        ->and($results->first()->original_name)->toBe('sunset-beach.jpg');
});

it('scopes media by mime type prefix', function (): void {
    Media::factory()->create(['mime_type' => 'image/jpeg']);
    Media::factory()->create(['mime_type' => 'image/png']);

    $results = Media::query()->ofMimeType('image/jpeg')->get();

    expect($results)->toHaveCount(1)
        ->and($results->first()->mime_type)->toBe('image/jpeg');
});
