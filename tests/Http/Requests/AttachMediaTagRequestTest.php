<?php

use Canvas\Http\Requests\AttachMediaTagRequest;
use Canvas\Models\Media;
use Canvas\Models\MediaTag;
use Illuminate\Support\Str;

it('requires media ids', function (): void {
    $tag = MediaTag::factory()->create();

    assertFormRequestInvalid(
        AttachMediaTagRequest::class,
        [],
        $this->contributor,
        ['media_ids'],
        ['mediaTag' => $tag],
        "canvas/api/media-tags/{$tag->id}/attach",
    );
});

it('rejects more than fifty media ids', function (): void {
    $tag = MediaTag::factory()->create();
    $ids = array_map(fn (): string => (string) Str::uuid(), range(1, 51));

    assertFormRequestInvalid(
        AttachMediaTagRequest::class,
        ['media_ids' => $ids],
        $this->contributor,
        ['media_ids'],
        ['mediaTag' => $tag],
        "canvas/api/media-tags/{$tag->id}/attach",
    );
});

it('allows contributors to attach to a tag they can view', function (): void {
    $tag = MediaTag::factory()->create();
    $media = Media::factory()->create(['user_id' => $this->contributor->id]);

    assertFormRequestValid(
        AttachMediaTagRequest::class,
        ['media_ids' => [$media->id]],
        $this->contributor,
        ['mediaTag' => $tag],
        "canvas/api/media-tags/{$tag->id}/attach",
    );
});
