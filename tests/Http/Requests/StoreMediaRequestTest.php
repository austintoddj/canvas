<?php

use Canvas\Http\Requests\StoreMediaRequest;
use Illuminate\Http\UploadedFile;
use Ramsey\Uuid\Uuid;

it('requires an uploaded file', function (): void {
    $id = Uuid::uuid4()->toString();

    assertFormRequestInvalid(
        StoreMediaRequest::class,
        [],
        $this->admin,
        ['file'],
        uri: "canvas/api/media/{$id}",
        files: [],
    );
});

it('rejects uploads that exceed the maximum filesize', function (): void {
    $id = Uuid::uuid4()->toString();
    $oversizeKb = (int) (config('canvas.upload_filesize') / 1024) + 1024;

    assertFormRequestInvalid(
        StoreMediaRequest::class,
        [],
        $this->admin,
        ['file'],
        uri: "canvas/api/media/{$id}",
        files: [
            'file' => UploadedFile::fake()->create('large.jpg', $oversizeKb, 'image/jpeg'),
        ],
    );
});

it('rejects uploads with disallowed mime types', function (): void {
    $id = Uuid::uuid4()->toString();

    assertFormRequestInvalid(
        StoreMediaRequest::class,
        [],
        $this->admin,
        ['file'],
        uri: "canvas/api/media/{$id}",
        files: [
            'file' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ],
    );
});

it('rejects metadata fields that exceed the maximum length', function (): void {
    $id = Uuid::uuid4()->toString();

    assertFormRequestInvalid(
        StoreMediaRequest::class,
        [
            'alt' => str_repeat('a', 256),
            'caption' => str_repeat('b', 256),
            'original_name' => str_repeat('c', 256),
        ],
        $this->admin,
        ['alt', 'caption', 'original_name'],
        uri: "canvas/api/media/{$id}",
        files: [
            'file' => UploadedFile::fake()->image('photo.jpg'),
        ],
    );
});

it('accepts a valid media upload payload', function (): void {
    $id = Uuid::uuid4()->toString();

    assertFormRequestValid(
        StoreMediaRequest::class,
        [
            'alt' => 'Alt text',
            'caption' => 'Caption text',
            'original_name' => 'photo.jpg',
        ],
        $this->admin,
        uri: "canvas/api/media/{$id}",
        files: [
            'file' => UploadedFile::fake()->image('photo.jpg'),
        ],
    );
});
