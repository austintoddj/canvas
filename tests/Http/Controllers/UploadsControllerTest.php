<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Canvas\Canvas;

/**
 * Class UploadsControllerTest.
 *
 * @covers \Canvas\Http\Controllers\UploadsController
 */
class UploadsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function generateExpectedFilename($file)
    {
        $path_parts = pathinfo($file->getClientOriginalName());
        $first_name = Str::kebab($path_parts['filename']);
        $unique_id = substr(md5($path_parts['filename']), 0, 8);

        return $first_name . '-' . $unique_id . '.' . $path_parts['extension'];
    }


    public function testEmptyUploadIsValidated(): void
    {
        Storage::fake(config('canvas.storage_disk'));

        $this->actingAs($this->admin, 'canvas')
            ->postJson('canvas/api/uploads', [null])
            ->assertStatus(400);
    }

    public function testUploadedImageCanBeStored(): void
    {
        Storage::fake(config('canvas.storage_disk'));

        // Simulate an image upload request
        $file = UploadedFile::fake()->image('sample-image.jpg');

        $response = $this->actingAs($this->admin, 'canvas')
            ->postJson('canvas/api/uploads', [$file])
            ->assertSuccessful();

        // Build the expected filename and path
        $expected_filename = $this->generateExpectedFilename($file);
        $expected_path = sprintf('%s/%s', Canvas::baseStoragePath(), $expected_filename);

        // Check that the file was stored at the expected path
        $this->assertSame(
            $response->getOriginalContent(),
            Storage::disk(config('canvas.storage_disk'))->url($expected_path)
        );
        $this->assertIsString($response->getContent());
        Storage::disk(config('canvas.storage_disk'))->assertExists($expected_path);

        // Now delete the uploaded file and verify it was removed
        $this->actingAs($this->admin, 'canvas')
            ->deleteJson('canvas/api/uploads', [$expected_filename])
            ->assertStatus(204);

        Storage::disk(config('canvas.storage_disk'))->assertExists($expected_path);
    }

    public function testDeleteUploadedImage(): void
    {
        Storage::fake(config('canvas.storage_disk'));

        $this->actingAs($this->admin, 'canvas')
            ->delete('canvas/api/uploads', [
                null,
            ])->assertStatus(400);

        // Simulate an image upload request
        $file = UploadedFile::fake()->image('sample-image.jpg');

        // Build the expected filename and path
        $expected_filename = $this->generateExpectedFilename($file);
        $expected_path = sprintf('%s/%s', Canvas::baseStoragePath(), $expected_filename);

        $this->actingAs($this->admin, 'canvas')
            ->deleteJson('canvas/api/uploads', [$file])
            ->assertSuccessful();

        Storage::disk(config('canvas.storage_disk'))->assertMissing($expected_path);
    }
}
