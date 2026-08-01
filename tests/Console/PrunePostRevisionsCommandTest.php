<?php

use Canvas\Enums\RevisionReason;
use Canvas\Models\Post;
use Canvas\Models\PostRevision;
use Canvas\Support\RecordPostRevision;
use Illuminate\Support\Str;

it('prunes excess revisions beyond the keep limit per post', function (): void {
    $post = Post::factory()->create();

    $ids = [];
    for ($i = 0; $i < 5; $i++) {
        $ids[] = PostRevision::factory()->create([
            'post_id' => $post->id,
            'title' => "V{$i}",
            'created_at' => now()->subMinutes(5 - $i),
            'updated_at' => now()->subMinutes(5 - $i),
        ])->id;
    }

    $other = Post::factory()->create();
    $otherRevision = PostRevision::factory()->create(['post_id' => $other->id]);

    $this->artisan('canvas:prune-post-revisions', ['--keep' => 2])
        ->assertSuccessful()
        ->expectsOutputToContain('Deleted 3 post revision row');

    $remaining = $post->fresh()->revisions()->orderByDesc('created_at')->pluck('id')->all();

    expect($remaining)->toHaveCount(2)
        ->and($remaining)->toBe([$ids[4], $ids[3]])
        ->and(PostRevision::query()->find($otherRevision->id))->not->toBeNull();
});

it('defaults to keeping fifty revisions per post', function (): void {
    $post = Post::factory()->create();

    for ($i = 0; $i < 52; $i++) {
        PostRevision::factory()->create([
            'post_id' => $post->id,
            'created_at' => now()->subMinutes(52 - $i),
            'updated_at' => now()->subMinutes(52 - $i),
        ]);
    }

    $this->artisan('canvas:prune-post-revisions')->assertSuccessful();

    expect($post->fresh()->revisions()->count())->toBe(PostRevision::DEFAULT_KEEP_PER_POST);
});

// Invariant: history cannot grow unbounded under the per-post keep policy.
it('prunes on write so history cannot grow unbounded', function (): void {
    $post = Post::factory()->create();
    $limit = PostRevision::DEFAULT_KEEP_PER_POST;

    for ($i = 0; $i < $limit + 3; $i++) {
        $revision = RecordPostRevision::fromSnapshot($post, [
            'title' => "Title {$i}",
            'slug' => 'slug',
            'body' => 'Body '.$i.'-'.Str::random(8),
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Updated);

        // Distinct timestamps so prune order is deterministic across drivers.
        if ($revision !== null) {
            $revision->forceFill([
                'created_at' => now()->subMinutes($limit + 3 - $i),
                'updated_at' => now()->subMinutes($limit + 3 - $i),
            ])->saveQuietly();
        }
    }

    $newest = $post->fresh()->revisions()
        ->orderByDesc('created_at')
        ->orderByDesc('id')
        ->first();

    expect($post->fresh()->revisions()->count())->toBe($limit)
        ->and($newest?->title)->toBe('Title '.($limit + 2));
});

it('stores the revision reason on create', function (): void {
    $post = Post::factory()->create();

    $revision = RecordPostRevision::fromSnapshot($post, [
        'title' => 'Hello',
        'slug' => 'hello',
        'body' => 'Body',
        'summary' => null,
    ], reason: RevisionReason::Published);

    expect($revision)->not->toBeNull()
        ->and($revision?->reason)->toBe(RevisionReason::Published)
        ->and($revision?->fresh()->reason)->toBe(RevisionReason::Published);
});
