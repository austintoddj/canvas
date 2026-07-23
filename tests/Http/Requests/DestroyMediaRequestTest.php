<?php

use Canvas\Http\Requests\DestroyMediaRequest;
use Canvas\Models\Media;

it('allows contributors to delete their own media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->contributor->id]);

    assertFormRequestValid(
        DestroyMediaRequest::class,
        [],
        $this->contributor,
        ['media' => $media],
        "canvas/api/media/{$media->id}",
        'DELETE',
    );
});

it('denies contributors from deleting another users media', function (): void {
    $media = Media::factory()->create(['user_id' => $this->editor->id]);

    assertFormRequestUnauthorized(
        DestroyMediaRequest::class,
        [],
        $this->contributor,
        ['media' => $media],
        "canvas/api/media/{$media->id}",
        'DELETE',
    );
});
