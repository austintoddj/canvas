<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Class UploadsControllerTest.
 *
 * @covers \Canvas\Http\Controllers\UploadsController
 */
class UploadsControllerTest extends TestCase
{
    use RefreshDatabase;

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

        // Construct the expected filename based on the unique hash logic
        $path_parts = pathinfo($file->getClientOriginalName());
        $first_name = \Illuminate\Support\Str::kebab($path_parts['filename']);
        $unique_id = substr(md5($path_parts['filename']), 0, 8);
        $expected_filename = $first_name . '-' . $unique_id . '.' . $path_parts['extension'];

        // Build the expected path in storage
        $expected_path = sprintf('%s/%s', Canvas::baseStoragePath(), $expected_filename);

        // Assert that the response content is the URL of the stored file
        $this->assertSame(
            $response->getOriginalContent(),
            Storage::disk(config('canvas.storage_disk'))->url($expected_path)
        );

        // Confirm that the response content is a string (URL)
        $this->assertIsString($response->getContent());

        // Assert that the file actually exists in the specified path
        Storage::disk(config('canvas.storage_disk'))->assertExists($expected_path);
    }

    public function testDeleteUploadedImage(): void
    {
        Storage::fake(config('canvas.storage_disk'));

        // Attempt to delete with an empty payload to check validation
        $this->actingAs($this->admin, 'canvas')
             ->deleteJson('canvas/api/uploads', [null])
             ->assertStatus(400);

        // Simulate uploading a file to storage
        $file = UploadedFile::fake()->image('sample-image.jpg');
        $this->actingAs($this->admin, 'canvas')
             ->postJson('canvas/api/uploads', [$file])
             ->assertSuccessful();

        // Construct the expected filename based on the unique hash logic
        $path_parts = pathinfo($file->getClientOriginalName());
        $first_name = \Illuminate\Support\Str::kebab($path_parts['filename']);
        $unique_id = substr(md5($path_parts['filename']), 0, 8);
        $expected_filename = $first_name . '-' . $unique_id . '.' . $path_parts['extension'];

        // Build the expected path in storage
        $expected_path = sprintf('%s/%s', Canvas::baseStoragePath(), $expected_filename);

        // Confirm the file was successfully uploaded
        Storage::disk(config('canvas.storage_disk'))->assertExists($expected_path);

        // Delete the uploaded file and verify deletion
        $this->actingAs($this->admin, 'canvas')
             ->deleteJson('canvas/api/uploads', [$expected_filename])
             ->assertSuccessful();

        // Confirm that the file has been removed from storage
        Storage::disk(config('canvas.storage_disk'))->assertMissing($expected_path);
    }
}
