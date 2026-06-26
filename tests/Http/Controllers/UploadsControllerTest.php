<?php

use Canvas\Support\Paths;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function (): void {
    Storage::fake(config('canvas.storage_disk'));
});

it('rejects an upload with no file', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/uploads')
        ->assertUnprocessable();
});

it('rejects an upload with a disallowed MIME type', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/uploads', ['file' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf')])
        ->assertUnprocessable();
});

it('rejects an upload that exceeds the maximum filesize', function (): void {
    $oversizeKb = (int) (config('canvas.upload_filesize') / 1024) + 1024;

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/uploads', ['file' => UploadedFile::fake()->create('large.jpg', $oversizeKb, 'image/jpeg')])
        ->assertUnprocessable();
});

it('stores an uploaded image and returns the url and path', function (): void {
    $file = UploadedFile::fake()->image('photo.jpg');

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/uploads', ['file' => $file])
        ->assertCreated()
        ->assertJsonStructure(['url', 'path']);

    $path = Paths::baseStoragePath().'/'.$file->hashName();

    expect($response->json('path'))->toBe($path);

    Storage::disk(config('canvas.storage_disk'))->assertExists($path);
});

it('rejects a delete request with no path', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->deleteJson('canvas/api/uploads')
        ->assertUnprocessable();
});

it('rejects a delete request with a path outside the upload directory', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->deleteJson('canvas/api/uploads', ['path' => '../../../etc/passwd'])
        ->assertUnprocessable();
});

it('deletes an uploaded image', function (): void {
    $file = UploadedFile::fake()->image('photo.jpg');
    $path = Paths::baseStoragePath().'/'.$file->hashName();

    Storage::disk(config('canvas.storage_disk'))->putFileAs(
        Paths::baseStoragePath(),
        $file,
        $file->hashName()
    );

    Storage::disk(config('canvas.storage_disk'))->assertExists($path);

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson('canvas/api/uploads', ['path' => $path])
        ->assertNoContent();

    Storage::disk(config('canvas.storage_disk'))->assertMissing($path);
});
