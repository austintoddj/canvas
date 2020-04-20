<?php

namespace Canvas\Tests\Controllers;

use Canvas\Http\Middleware\Session;
use Canvas\Tests\TestCase;
use Illuminate\Auth\Middleware\Authorize;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MediaControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware([Authorize::class, Session::class, VerifyCsrfToken::class]);

        $this->registerAssertJsonExactFragmentMacro();
    }

    /** @test */
    public function media_can_be_stored()
    {
        Storage::fake(config('canvas.storage_disk'));

        $user = factory(config('canvas.user'))->create();

        $this->actingAs($user)->postJson('canvas/api/media/uploads', [
            null,
        ])->assertStatus(400);

        $this->actingAs($user)->postJson('canvas/api/media/uploads', [
            UploadedFile::fake()->image('photo.jpg'),
        ])->assertSuccessful();
    }

    /** @test */
    public function media_can_be_deleted()
    {
        Storage::fake(config('canvas.storage_disk'));

        $user = factory(config('canvas.user'))->create();

        $this->actingAs($user)->deleteJson('canvas/api/media/uploads', [
            null,
        ])->assertStatus(400);

        $this->actingAs($user)->deleteJson('canvas/api/media/uploads', [
            UploadedFile::fake()->image('photo.jpg'),
        ])->assertSuccessful();
    }
}
