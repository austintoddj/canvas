<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('empty upload is validated', function (): void {
    Storage::fake(config('canvas.storage_disk'));

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/uploads', [null])
        ->assertStatus(400);
});
it('uploaded image can be stored', function (): void {
    Storage::fake(config('canvas.storage_disk'));

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/uploads', [$file = UploadedFile::fake()->image('1.jpg')])
        ->assertSuccessful();

    $path = sprintf('%s/%s/%s', config('canvas.storage_path'), 'images', $file->hashName());

    $this->assertSame(
        $response->getOriginalContent(),
        Storage::disk(config('canvas.storage_disk'))->url($path)
    );

    $this->assertIsString($response->getContent());

    Storage::disk(config('canvas.storage_disk'))->assertExists($path);
});
it('delete uploaded image', function (): void {
    Storage::fake(config('canvas.storage_disk'));

    $this->actingAs($this->admin, 'canvas')
        ->delete('canvas/api/uploads', [
            null,
        ])->assertStatus(400);

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson('canvas/api/uploads', [$file = UploadedFile::fake()->image('1.jpg')])
        ->assertSuccessful();

    $path = sprintf('%s/%s/%s', config('canvas.storage_path'), 'images', $file->hashName());

    Storage::disk(config('canvas.storage_disk'))->assertMissing($path);
});
