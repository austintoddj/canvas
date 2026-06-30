<?php

use Canvas\Models\Media;
use Canvas\Support\MediaService;
use Canvas\Support\Paths;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Ramsey\Uuid\Uuid;

beforeEach(function (): void {
    Storage::fake(config('canvas.storage_disk'));
});

it('rolls back stored files when media library save fails', function (): void {
    Media::creating(function (): void {
        throw new RuntimeException('Simulated database failure');
    });

    $service = app(MediaService::class);
    $file = UploadedFile::fake()->image('photo.jpg');

    expect(fn () => $service->storeMediaUpload($file, $this->admin, (string) Uuid::uuid4()))
        ->toThrow(RuntimeException::class);

    $path = Paths::baseStoragePath().'/'.$file->hashName();

    Storage::disk(config('canvas.storage_disk'))->assertMissing($path);
});

it('deletes the previous file when replacing existing media', function (): void {
    $oldPath = Paths::baseStoragePath().'/old.jpg';
    $service = app(MediaService::class);

    Storage::disk(config('canvas.storage_disk'))->put($oldPath, 'old-image');

    $media = Media::factory()->create([
        'user_id' => $this->admin->id,
        'path' => $oldPath,
    ]);

    $newFile = UploadedFile::fake()->image('new.jpg');

    $updated = $service->storeMediaUpload($newFile, $this->admin, $media->id);

    $newPath = Paths::baseStoragePath().'/'.$newFile->hashName();

    expect($updated->path)->toBe($newPath);

    Storage::disk(config('canvas.storage_disk'))->assertExists($newPath);
    Storage::disk(config('canvas.storage_disk'))->assertMissing($oldPath);
});
