<?php

use Canvas\Http\Requests\StoreMediaRequest;
use Canvas\Support\UploadLimits;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

it('requires an uploaded file', function (): void {
    $id = (string) Str::uuid();

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
    $id = (string) Str::uuid();
    $oversizeKb = UploadLimits::maxKilobytes() + 1024;

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

it('uses a human-readable max filesize validation message', function (): void {
    $id = (string) Str::uuid();
    $oversizeKb = UploadLimits::maxKilobytes() + 1024;

    $request = makeFormRequest(
        StoreMediaRequest::class,
        [],
        $this->admin,
        [],
        "canvas/api/media/{$id}",
        'POST',
        [
            'file' => UploadedFile::fake()->create('large.jpg', $oversizeKb, 'image/jpeg'),
        ],
    );

    try {
        $request->validateResolved();
        expect(false)->toBeTrue('Expected validation to fail.');
    } catch (ValidationException $exception) {
        expect($exception->errors()['file'][0] ?? null)->toBe(UploadLimits::tooLargeMessage());
    }
});

it('rejects uploads with disallowed mime types', function (): void {
    $id = (string) Str::uuid();

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
    $id = (string) Str::uuid();

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
    $id = (string) Str::uuid();

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
