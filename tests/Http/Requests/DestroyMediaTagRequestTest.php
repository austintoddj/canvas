<?php

use Canvas\Http\Requests\DestroyMediaTagRequest;
use Canvas\Models\MediaTag;

it('allows editors to delete tags', function (): void {
    $tag = MediaTag::factory()->create();

    assertFormRequestValid(
        DestroyMediaTagRequest::class,
        [],
        $this->editor,
        ['mediaTag' => $tag],
        "canvas/api/media-tags/{$tag->id}",
        'DELETE',
    );
});

it('denies contributors from deleting tags', function (): void {
    $tag = MediaTag::factory()->create();

    assertFormRequestUnauthorized(
        DestroyMediaTagRequest::class,
        [],
        $this->contributor,
        ['mediaTag' => $tag],
        "canvas/api/media-tags/{$tag->id}",
        'DELETE',
    );
});
