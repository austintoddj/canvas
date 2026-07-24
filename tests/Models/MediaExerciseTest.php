<?php

use Canvas\Models\Media;
use Canvas\Support\MediaUrl;
use Canvas\Support\Paths;
use Illuminate\Support\Facades\Storage;

it('exercises media factory storage and url generation end to end', function (): void {
    Storage::fake(config('canvas.storage_disk'));

    $path = Paths::baseStoragePath().'/exercise.jpg';
    Storage::disk(config('canvas.storage_disk'))->put($path, 'exercise-image-data');

    $media = Media::factory()->create([
        'path' => $path,
        'mime_type' => 'image/jpeg',
        'user_id' => $this->admin->id,
    ]);

    $retrieved = Media::query()->findOrFail($media->id);

    expect($retrieved->url)->toBe(MediaUrl::forDiskPath($path))
        ->and($retrieved->url)->toStartWith('/storage/')
        ->and($retrieved->type)->toBe('image')
        ->and($retrieved->path)->toBe($path)
        ->and($retrieved->user_id)->toBe($this->admin->id);
});
