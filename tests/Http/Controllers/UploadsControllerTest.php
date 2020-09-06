<?php

namespace Canvas\Tests\Http\Controllers;

use Canvas\Models\User;
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

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
    }

    /** @test */
    public function it_can_store_media()
    {
        Storage::fake(config('canvas.storage_disk'));

        $user = factory(User::class)->create();

        $this->actingAs($user, 'canvas')->postJson('canvas/api/uploads', [
            null,
        ])->assertStatus(400);

        $this->actingAs($user, 'canvas')->postJson('canvas/api/uploads', [
            $file = UploadedFile::fake()->image('photo.jpg'),
        ])->assertSuccessful();

        $path = sprintf('%s/%s/%s', config('canvas.storage_path'), 'images', $file->hashName());

        Storage::disk(config('canvas.storage_disk'))->assertExists($path);
    }

    /** @test */
    public function it_can_delete_media()
    {
        Storage::fake(config('canvas.storage_disk'));

        $user = factory(User::class)->create();

        $this->actingAs($user, 'canvas')->delete('canvas/api/uploads', [
            null,
        ])->assertStatus(400);

        $this->actingAs($user, 'canvas')->deleteJson('canvas/api/uploads', [
            $file = UploadedFile::fake()->image('photo.jpg'),
        ])->assertSuccessful();

        $path = sprintf('%s/%s/%s', config('canvas.storage_path'), 'images', $file->hashName());

        Storage::disk(config('canvas.storage_disk'))->assertMissing($path);
    }
}
