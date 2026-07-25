<?php

use Canvas\Models\Media;
use Canvas\Support\Paths;
use Canvas\Support\UploadLimits;
use Canvas\Tests\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

beforeEach(function (): void {
    Storage::fake(config('canvas.storage_disk'));
});

it('lists media for the authenticated user', function (): void {
    Media::factory()->count(2)->create(['user_id' => $this->admin->id]);
    Media::factory()->create(['user_id' => $this->editor->id]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/media')
        ->assertSuccessful();

    expect($response->getOriginalContent())->toBeInstanceOf(LengthAwarePaginator::class)
        ->and($response->getOriginalContent())->toHaveCount(2);
});

it('lists all media for editors when scope is all', function (): void {
    Media::factory()->count(2)->create(['user_id' => $this->admin->id]);
    Media::factory()->create(['user_id' => $this->editor->id]);

    $response = $this->actingAs($this->editor, 'canvas')
        ->getJson('canvas/api/media?scope=all')
        ->assertSuccessful();

    expect($response->getOriginalContent())->toHaveCount(3);
});

it('filters media by search term', function (): void {
    Media::factory()->create([
        'user_id' => $this->admin->id,
        'original_name' => 'sunset.jpg',
    ]);
    Media::factory()->create([
        'user_id' => $this->admin->id,
        'original_name' => 'mountain.jpg',
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/media?search=sunset')
        ->assertSuccessful();

    expect($response->getOriginalContent())->toHaveCount(1)
        ->and($response->getOriginalContent()->first()->original_name)->toBe('sunset.jpg');
});

it('filters media by mime type', function (): void {
    Media::factory()->create([
        'user_id' => $this->admin->id,
        'mime_type' => 'image/jpeg',
    ]);
    Media::factory()->create([
        'user_id' => $this->admin->id,
        'mime_type' => 'image/png',
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/media?mime=image/jpeg')
        ->assertSuccessful();

    expect($response->getOriginalContent())->toHaveCount(1)
        ->and($response->getOriginalContent()->first()->mime_type)->toBe('image/jpeg');
});

it('sorts media newest first by default and oldest when requested', function (): void {
    $older = Media::factory()->create([
        'user_id' => $this->admin->id,
        'created_at' => now()->subDay(),
    ]);
    $newer = Media::factory()->create([
        'user_id' => $this->admin->id,
        'created_at' => now(),
    ]);

    $default = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/media')
        ->assertSuccessful()
        ->getOriginalContent();

    expect($default->pluck('id')->all())->toBe([$newer->id, $older->id]);

    $oldest = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/media?sort=oldest')
        ->assertSuccessful()
        ->getOriginalContent();

    expect($oldest->pluck('id')->all())->toBe([$older->id, $newer->id]);
});

it('returns data for creating media', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/media/create')
        ->assertSuccessful();

    expect($response->getOriginalContent())->toBeInstanceOf(Media::class)
        ->and($response->getOriginalContent()->id)->not->toBeEmpty();
});

it('returns existing media data', function (): void {
    $media = Media::factory()->create(['user_id' => $this->admin->id]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/media/{$media->id}")
        ->assertSuccessful();

    expect($media->is($response->getOriginalContent()))->toBeTrue();
});

it('returns not found for media the user cannot view', function (): void {
    $media = Media::factory()->create(['user_id' => $this->editor->id]);

    $this->actingAs($this->contributor, 'canvas')
        ->getJson("canvas/api/media/{$media->id}")
        ->assertNotFound();
});

it('stores uploaded media and persists the file', function (): void {
    $id = (string) Str::uuid();
    $file = UploadedFile::fake()->image('photo.jpg');

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/media/{$id}", [
            'file' => $file,
            'alt' => 'A photo',
            'caption' => 'Caption text',
        ])
        ->assertCreated();

    $path = Paths::baseStoragePath().'/'.$file->hashName();

    expect($response->getOriginalContent())->toBeInstanceOf(Media::class)
        ->and($response->getOriginalContent()->id)->toBe($id)
        ->and($response->getOriginalContent()->path)->toBe($path)
        ->and($response->getOriginalContent()->alt)->toBe('A photo')
        ->and($response->getOriginalContent()->caption)->toBe('Caption text')
        ->and($response->getOriginalContent()->url)->toStartWith('/storage/')
        ->and($response->getOriginalContent()->url)->not->toContain('http');

    Storage::disk(config('canvas.storage_disk'))->assertExists($path);

    $this->assertDatabaseHas('canvas_media', [
        'id' => $id,
        'path' => $path,
        'user_id' => $this->admin->id,
    ]);
});

it('returns root-relative media urls when the disk url bakes APP_URL', function (): void {
    Storage::fake(config('canvas.storage_disk'), [
        'url' => 'http://localhost:8000/storage',
    ]);

    $id = (string) Str::uuid();
    $file = UploadedFile::fake()->image('photo.jpg');

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/media/{$id}", [
            'file' => $file,
        ])
        ->assertCreated();

    expect($response->json('url'))
        ->toStartWith('/storage/')
        ->not->toContain('localhost:8000');
});

it('does not store a file when replacing another users media is denied', function (): void {
    $existing = Media::factory()->create(['user_id' => $this->editor->id]);
    $file = UploadedFile::fake()->image('photo.jpg');

    $this->actingAs($this->contributor, 'canvas')
        ->postJson("canvas/api/media/{$existing->id}", ['file' => $file])
        ->assertNotFound();

    $path = Paths::baseStoragePath().'/'.$file->hashName();

    Storage::disk(config('canvas.storage_disk'))->assertMissing($path);
});

it('replaces an existing media file and deletes the previous file', function (): void {
    $oldFile = UploadedFile::fake()->image('old.jpg');
    $oldPath = Paths::baseStoragePath().'/'.$oldFile->hashName();

    Storage::disk(config('canvas.storage_disk'))->putFileAs(
        Paths::baseStoragePath(),
        $oldFile,
        $oldFile->hashName(),
    );

    $media = Media::factory()->create([
        'user_id' => $this->admin->id,
        'path' => $oldPath,
    ]);

    $newFile = UploadedFile::fake()->image('new.jpg');

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/media/{$media->id}", ['file' => $newFile])
        ->assertCreated();

    $newPath = Paths::baseStoragePath().'/'.$newFile->hashName();

    Storage::disk(config('canvas.storage_disk'))->assertExists($newPath);
    Storage::disk(config('canvas.storage_disk'))->assertMissing($oldPath);
});

it('cleans up the stored file when media save fails', function (): void {
    Media::creating(function (): void {
        throw new RuntimeException('Simulated database failure');
    });

    $id = (string) Str::uuid();
    $file = UploadedFile::fake()->image('photo.jpg');

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/media/{$id}", ['file' => $file])
        ->assertServerError();

    $path = Paths::baseStoragePath().'/'.$file->hashName();

    Storage::disk(config('canvas.storage_disk'))->assertMissing($path);
});

it('rejects an upload with no file', function (): void {
    $id = (string) Str::uuid();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/media/{$id}")
        ->assertUnprocessable();
});

it('rejects an upload that exceeds the maximum filesize', function (): void {
    $id = (string) Str::uuid();
    $oversizeKb = UploadLimits::maxKilobytes() + 1024;

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/media/{$id}", [
            'file' => UploadedFile::fake()->create('large.jpg', $oversizeKb, 'image/jpeg'),
        ])
        ->assertUnprocessable()
        ->assertJsonPath('errors.file.0', UploadLimits::tooLargeMessage());
});

it('rejects media uploads with disallowed mime types', function (): void {
    $id = (string) Str::uuid();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/media/{$id}", [
            'file' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ])
        ->assertUnprocessable();
});

it('updates media metadata', function (): void {
    $media = Media::factory()->create([
        'user_id' => $this->admin->id,
        'alt' => null,
        'caption' => null,
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->putJson("canvas/api/media/{$media->id}", [
            'alt' => 'Updated alt text',
            'caption' => 'Updated caption',
            'original_name' => 'renamed.jpg',
        ])
        ->assertSuccessful();

    expect($response->getOriginalContent()->alt)->toBe('Updated alt text')
        ->and($response->getOriginalContent()->caption)->toBe('Updated caption')
        ->and($response->getOriginalContent()->original_name)->toBe('renamed.jpg');
});

it('forbids updating media owned by another contributor', function (): void {
    $media = Media::factory()->create(['user_id' => $this->editor->id]);

    $this->actingAs($this->contributor, 'canvas')
        ->putJson("canvas/api/media/{$media->id}", ['alt' => 'Nope'])
        ->assertForbidden();
});

it('deletes media and removes the stored file', function (): void {
    $file = UploadedFile::fake()->image('photo.jpg');
    $path = Paths::baseStoragePath().'/'.$file->hashName();

    Storage::disk(config('canvas.storage_disk'))->putFileAs(
        Paths::baseStoragePath(),
        $file,
        $file->hashName(),
    );

    $media = Media::factory()->create([
        'user_id' => $this->admin->id,
        'path' => $path,
    ]);

    Storage::disk(config('canvas.storage_disk'))->assertExists($path);

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson("canvas/api/media/{$media->id}")
        ->assertNoContent();

    Storage::disk(config('canvas.storage_disk'))->assertMissing($path);

    $this->assertSoftDeleted('canvas_media', [
        'id' => $media->id,
        'path' => $path,
    ]);

    // Restoring the soft-deleted row would not bring the disk file back.
    expect(Storage::disk(config('canvas.storage_disk'))->exists($path))->toBeFalse();
});

it('forbids deleting media owned by another contributor', function (): void {
    $media = Media::factory()->create(['user_id' => $this->editor->id]);

    $this->actingAs($this->contributor, 'canvas')
        ->deleteJson("canvas/api/media/{$media->id}")
        ->assertForbidden();
});

it('allows admins to view media owned by other users', function (): void {
    $otherUser = User::factory()->contributor()->create();
    $media = Media::factory()->create(['user_id' => $otherUser->id]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/media/{$media->id}")
        ->assertSuccessful();

    expect($media->is($response->getOriginalContent()))->toBeTrue();
});
