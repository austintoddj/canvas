<?php

use Canvas\Http\Requests\StoreMediaTagRequest;
use Canvas\Models\MediaTag;
use Illuminate\Support\Str;

it('requires a name', function (): void {
    assertFormRequestInvalid(
        StoreMediaTagRequest::class,
        [],
        $this->editor,
        ['name'],
        uri: 'canvas/api/media-tags/'.(string) Str::uuid(),
    );
});

it('rejects names longer than 80 characters', function (): void {
    assertFormRequestInvalid(
        StoreMediaTagRequest::class,
        ['name' => str_repeat('a', 81)],
        $this->editor,
        ['name'],
        uri: 'canvas/api/media-tags/'.(string) Str::uuid(),
    );
});

it('allows contributors to create tags', function (): void {
    assertFormRequestValid(
        StoreMediaTagRequest::class,
        ['name' => 'Hero'],
        $this->contributor,
        uri: 'canvas/api/media-tags/'.(string) Str::uuid(),
    );
});

it('denies contributors from renaming tags', function (): void {
    $tag = MediaTag::factory()->create(['user_id' => $this->contributor->id]);

    assertFormRequestUnauthorized(
        StoreMediaTagRequest::class,
        ['name' => 'Homepage'],
        $this->contributor,
        ['id' => $tag->id],
        "canvas/api/media-tags/{$tag->id}",
    );
});

it('allows editors to rename tags', function (): void {
    $tag = MediaTag::factory()->create();

    assertFormRequestValid(
        StoreMediaTagRequest::class,
        ['name' => 'Homepage'],
        $this->editor,
        ['id' => $tag->id],
        "canvas/api/media-tags/{$tag->id}",
    );
});
