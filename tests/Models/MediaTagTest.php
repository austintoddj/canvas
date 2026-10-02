<?php

use Canvas\Models\Media;
use Canvas\Models\MediaTag;
use Canvas\Tests\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

it('defines the media relationship', function (): void {
    $tag = MediaTag::factory()->create();
    $media = Media::factory()->create();

    $tag->media()->sync([$media->id]);

    expect($tag->media())->toBeInstanceOf(BelongsToMany::class)
        ->and($tag->media)->toHaveCount(1)
        ->and($tag->media->first())->toBeInstanceOf(Media::class);
});

it('defines the user relationship', function (): void {
    $tag = MediaTag::factory()->create();

    expect($tag->user())->toBeInstanceOf(BelongsTo::class)
        ->and($tag->user)->toBeInstanceOf(User::class);
});

it('detaches media on delete', function (): void {
    $tag = MediaTag::factory()->create();
    $media = Media::factory()->create();

    $tag->media()->sync([$media->id]);

    $tag->delete();

    $this->assertSoftDeleted('canvas_media_tags', [
        'id' => $tag->id,
    ]);
    $this->assertDatabaseMissing('canvas_media_tag', [
        'media_id' => $media->id,
        'media_tag_id' => $tag->id,
    ]);
});

it('computes a non-empty slug for non-ascii names', function (): void {
    expect(MediaTag::slugFor('ヒーロー'))->toStartWith('tag-')
        ->and(MediaTag::slugFor('ヒーロー'))->not->toBe('')
        ->and(MediaTag::slugFor('Hero'))->toBe('hero')
        ->and(MediaTag::slugFor('hero'))->toBe('hero');
});
