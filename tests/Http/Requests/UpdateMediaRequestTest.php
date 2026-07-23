<?php

use Canvas\Http\Requests\UpdateMediaRequest;
use Canvas\Models\Media;

it('rejects metadata fields that exceed the maximum length', function (): void {
    $media = Media::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        UpdateMediaRequest::class,
        [
            'alt' => str_repeat('a', 256),
            'caption' => str_repeat('b', 256),
            'original_name' => str_repeat('c', 256),
        ],
        $this->admin,
        ['alt', 'caption', 'original_name'],
        ['media' => $media],
        "canvas/api/media/{$media->id}",
        'PUT',
    );
});

it('accepts valid media metadata updates', function (): void {
    $media = Media::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestValid(
        UpdateMediaRequest::class,
        [
            'alt' => 'Updated alt text',
            'caption' => 'Updated caption',
            'original_name' => 'renamed.jpg',
        ],
        $this->admin,
        ['media' => $media],
        "canvas/api/media/{$media->id}",
        'PUT',
    );
});

it('allows contributors to update their own media metadata', function (): void {
    $media = Media::factory()->create(['user_id' => $this->contributor->id]);

    assertFormRequestValid(
        UpdateMediaRequest::class,
        [
            'alt' => 'Contributor alt text',
        ],
        $this->contributor,
        ['media' => $media],
        "canvas/api/media/{$media->id}",
        'PUT',
    );
});

it('denies contributors from updating another users media metadata', function (): void {
    $media = Media::factory()->create(['user_id' => $this->editor->id]);

    assertFormRequestUnauthorized(
        UpdateMediaRequest::class,
        [
            'alt' => 'Nope',
        ],
        $this->contributor,
        ['media' => $media],
        "canvas/api/media/{$media->id}",
        'PUT',
    );
});
