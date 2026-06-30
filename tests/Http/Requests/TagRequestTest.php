<?php

use Canvas\Http\Requests\TagRequest;
use Canvas\Models\Tag;

it('requires a name and slug', function (): void {
    $tag = Tag::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        TagRequest::class,
        [],
        $this->admin,
        ['name', 'slug'],
        uri: "canvas/api/tags/{$tag->id}",
    );
});

it('rejects invalid slugs', function (): void {
    $tag = Tag::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        TagRequest::class,
        [
            'name' => 'A new tag',
            'slug' => 'a new.slug',
        ],
        $this->admin,
        ['slug'],
        uri: "canvas/api/tags/{$tag->id}",
    );
});

it('rejects duplicate slugs for the same user', function (): void {
    $existing = Tag::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'taken-tag',
    ]);
    $tag = Tag::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        TagRequest::class,
        [
            'name' => 'Another tag',
            'slug' => $existing->slug,
        ],
        $this->admin,
        ['slug'],
        uri: "canvas/api/tags/{$tag->id}",
    );
});

it('allows taxonomy managers to save tags', function (): void {
    $tag = Tag::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestValid(
        TagRequest::class,
        [
            'name' => 'Updated tag',
            'slug' => 'updated-tag',
        ],
        $this->admin,
        uri: "canvas/api/tags/{$tag->id}",
    );
});

it('denies contributors from managing tags', function (): void {
    $tag = Tag::factory()->create(['user_id' => $this->contributor->id]);

    assertFormRequestUnauthorized(
        TagRequest::class,
        [
            'name' => 'Contributor tag',
            'slug' => 'contributor-tag',
        ],
        $this->contributor,
        uri: "canvas/api/tags/{$tag->id}",
    );
});
