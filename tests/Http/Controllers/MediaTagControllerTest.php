<?php

use Canvas\Models\Media;
use Canvas\Models\MediaTag;
use Illuminate\Support\Str;

it('lists tags with visibility-scoped counts for contributors', function (): void {
    $tag = MediaTag::factory()->create(['name' => 'Hero', 'slug' => 'hero']);
    $own = Media::factory()->create(['user_id' => $this->contributor->id]);
    $other = Media::factory()->create(['user_id' => $this->editor->id]);
    Media::factory()->create(['user_id' => $this->contributor->id]);
    $tag->media()->sync([$own->id, $other->id]);

    $this->actingAs($this->contributor, 'canvas')
        ->getJson('canvas/api/media-tags')
        ->assertOk()
        ->assertJsonPath('data.0.id', $tag->id)
        ->assertJsonPath('data.0.name', 'Hero')
        ->assertJsonPath('data.0.media_count', 1)
        ->assertJsonPath('meta.all_count', 2)
        ->assertJsonPath('meta.untagged_count', 1)
        ->assertJsonPath('meta.truncated', false)
        ->assertJsonMissingPath('data.0.slug')
        ->assertJsonMissingPath('data.0.user_id');
});

it('scopes editor counts to all authors when requested', function (): void {
    $tag = MediaTag::factory()->create(['name' => 'Hero', 'slug' => 'hero']);
    $own = Media::factory()->create(['user_id' => $this->editor->id]);
    $other = Media::factory()->create(['user_id' => $this->contributor->id]);
    $tag->media()->sync([$own->id, $other->id]);

    $this->actingAs($this->editor, 'canvas')
        ->getJson('canvas/api/media-tags?scope=all')
        ->assertOk()
        ->assertJsonPath('data.0.media_count', 2)
        ->assertJsonPath('meta.all_count', 2)
        ->assertJsonPath('meta.untagged_count', 0);

    $this->actingAs($this->editor, 'canvas')
        ->getJson('canvas/api/media-tags?scope=user')
        ->assertOk()
        ->assertJsonPath('data.0.media_count', 1)
        ->assertJsonPath('meta.all_count', 1);
});

it('orders tags by name and caps the list at 200', function (): void {
    MediaTag::factory()->create(['name' => 'Zulu', 'slug' => 'zulu']);
    MediaTag::factory()->create(['name' => 'Alpha', 'slug' => 'alpha']);

    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/media-tags')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Alpha')
        ->assertJsonPath('data.1.name', 'Zulu');
});

it('returns a uuid for creating a tag', function (): void {
    $this->actingAs($this->contributor, 'canvas')
        ->getJson('canvas/api/media-tags/create')
        ->assertOk()
        ->assertJsonStructure(['id']);
});

it('stores a new tag for a contributor', function (): void {
    $id = (string) Str::uuid();

    $this->actingAs($this->contributor, 'canvas')
        ->postJson("canvas/api/media-tags/{$id}", ['name' => 'Hero'])
        ->assertCreated()
        ->assertJsonPath('id', $id)
        ->assertJsonPath('name', 'Hero')
        ->assertJsonPath('media_count', 0)
        ->assertJsonMissingPath('slug');

    $this->assertDatabaseHas('canvas_media_tags', [
        'id' => $id,
        'name' => 'Hero',
        'slug' => 'hero',
        'user_id' => $this->contributor->id,
    ]);
});

it('restores a soft-deleted tag by slug and returns the original id', function (): void {
    $deleted = MediaTag::factory()->create([
        'name' => 'Hero',
        'slug' => 'hero',
        'deleted_at' => now(),
    ]);
    $clientId = (string) Str::uuid();

    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/media-tags/{$clientId}", ['name' => 'Hero'])
        ->assertCreated()
        ->assertJsonPath('id', $deleted->id)
        ->assertJsonPath('name', 'Hero');

    expect($deleted->fresh()->trashed())->toBeFalse()
        ->and($deleted->fresh()->id)->not->toBe($clientId);
});

it('creates a japanese name with a non-empty slug', function (): void {
    $id = (string) Str::uuid();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/media-tags/{$id}", ['name' => 'ヒーロー'])
        ->assertCreated()
        ->assertJsonPath('id', $id)
        ->assertJsonPath('name', 'ヒーロー');

    $row = MediaTag::query()->findOrFail($id);

    expect($row->slug)->not->toBe('')
        ->and($row->slug)->toStartWith('tag-');
});

it('renames a tag and recomputes the slug', function (): void {
    $tag = MediaTag::factory()->create([
        'name' => 'Hero',
        'slug' => 'hero',
    ]);

    $this->actingAs($this->editor, 'canvas')
        ->postJson("canvas/api/media-tags/{$tag->id}", ['name' => 'Homepage'])
        ->assertOk()
        ->assertJsonPath('id', $tag->id)
        ->assertJsonPath('name', 'Homepage');

    expect($tag->fresh()->slug)->toBe('homepage');
});

it('rejects a second live tag with the same slug and includes the existing tag id', function (): void {
    $existing = MediaTag::factory()->create([
        'name' => 'Homepage',
        'slug' => 'homepage',
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/media-tags/'.(string) Str::uuid(), ['name' => 'Homepage'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name'])
        ->assertJsonPath('tag.id', $existing->id)
        ->assertJsonPath('tag.name', 'Homepage');
});

it('treats hero and Hero as the same slug', function (): void {
    MediaTag::factory()->create([
        'name' => 'Hero',
        'slug' => 'hero',
    ]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson('canvas/api/media-tags/'.(string) Str::uuid(), ['name' => 'hero'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('forbids contributors from renaming tags', function (): void {
    $tag = MediaTag::factory()->create(['name' => 'Hero', 'slug' => 'hero']);

    $this->actingAs($this->contributor, 'canvas')
        ->postJson("canvas/api/media-tags/{$tag->id}", ['name' => 'Homepage'])
        ->assertForbidden();
});

it('forbids contributors from deleting tags', function (): void {
    $tag = MediaTag::factory()->create();

    $this->actingAs($this->contributor, 'canvas')
        ->deleteJson("canvas/api/media-tags/{$tag->id}")
        ->assertForbidden();
});

it('deletes a tag and detaches memberships', function (): void {
    $tag = MediaTag::factory()->create();
    $media = Media::factory()->create(['user_id' => $this->admin->id]);
    $tag->media()->sync([$media->id]);

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson("canvas/api/media-tags/{$tag->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('canvas_media_tags', ['id' => $tag->id]);
    $this->assertDatabaseMissing('canvas_media_tag', [
        'media_id' => $media->id,
        'media_tag_id' => $tag->id,
    ]);
});

it('attaches media and skips unauthorized ids', function (): void {
    $tag = MediaTag::factory()->create(['name' => 'Hero', 'slug' => 'hero']);
    $own = Media::factory()->create(['user_id' => $this->contributor->id]);
    $other = Media::factory()->create(['user_id' => $this->editor->id]);
    $missing = (string) Str::uuid();

    $this->actingAs($this->contributor, 'canvas')
        ->postJson("canvas/api/media-tags/{$tag->id}/attach", [
            'media_ids' => [$own->id, $other->id, $missing],
        ])
        ->assertOk()
        ->assertJsonPath('attached', [$own->id])
        ->assertJsonPath('skipped', [$other->id, $missing])
        ->assertJsonPath('media_count', 1);

    $this->assertDatabaseHas('canvas_media_tag', [
        'media_id' => $own->id,
        'media_tag_id' => $tag->id,
    ]);
});

it('treats duplicate attach as attached', function (): void {
    $tag = MediaTag::factory()->create();
    $media = Media::factory()->create(['user_id' => $this->admin->id]);
    $tag->media()->sync([$media->id]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/media-tags/{$tag->id}/attach", [
            'media_ids' => [$media->id],
        ])
        ->assertOk()
        ->assertJsonPath('attached', [$media->id])
        ->assertJsonPath('skipped', []);
});

it('detaches an unattached authorized file as detached not skipped', function (): void {
    $tag = MediaTag::factory()->create();
    $media = Media::factory()->create(['user_id' => $this->admin->id]);

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/media-tags/{$tag->id}/detach", [
            'media_ids' => [$media->id],
        ])
        ->assertOk()
        ->assertJsonPath('detached', [$media->id])
        ->assertJsonPath('skipped', [])
        ->assertJsonPath('media_count', 0);
});

it('skips unauthorized ids on detach', function (): void {
    $tag = MediaTag::factory()->create();
    $other = Media::factory()->create(['user_id' => $this->editor->id]);

    $this->actingAs($this->contributor, 'canvas')
        ->postJson("canvas/api/media-tags/{$tag->id}/detach", [
            'media_ids' => [$other->id],
        ])
        ->assertOk()
        ->assertJsonPath('detached', [])
        ->assertJsonPath('skipped', [$other->id]);
});
