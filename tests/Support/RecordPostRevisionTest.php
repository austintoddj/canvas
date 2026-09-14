<?php

use Canvas\Enums\RevisionReason;
use Canvas\Models\Post;
use Canvas\Models\PostRevision;
use Canvas\Support\PostSnapshot;
use Canvas\Support\RecordPostRevision;

describe('reasonForStore', function (): void {
    it('returns origin when there are no revisions yet and visibility is unchanged draft', function (): void {
        $after = PostSnapshot::make([
            'title' => 'Hello',
            'body' => 'Body',
            'published_at' => null,
        ]);

        expect(RecordPostRevision::reasonForStore(null, $after, promote: false, hadRevisions: false))
            ->toBe(RevisionReason::Origin);
    });

    it('returns published not origin when first store also goes live', function (): void {
        $after = PostSnapshot::make([
            'title' => 'Hello',
            'body' => 'Body',
            'published_at' => now()->subMinute(),
        ]);

        expect(RecordPostRevision::reasonForStore(null, $after, promote: true, hadRevisions: false))
            ->toBe(RevisionReason::Published);
    });

    it('returns null for draft content change when revisions already exist', function (): void {
        $before = PostSnapshot::make([
            'title' => 'A',
            'body' => 'One',
            'published_at' => null,
        ]);
        $after = PostSnapshot::make([
            'title' => 'B',
            'body' => 'Two',
            'published_at' => null,
        ]);

        expect(RecordPostRevision::reasonForStore($before, $after, promote: false, hadRevisions: true))
            ->toBeNull();
    });

    it('returns null for scheduled content change when published_at is unchanged', function (): void {
        $at = now()->addWeek()->format('Y-m-d H:i:s');
        $before = PostSnapshot::make([
            'title' => 'A',
            'body' => 'One',
            'published_at' => $at,
        ]);
        $after = PostSnapshot::make([
            'title' => 'B',
            'body' => 'Two',
            'published_at' => $at,
        ]);

        expect(RecordPostRevision::reasonForStore($before, $after, promote: false, hadRevisions: true))
            ->toBeNull();
    });

    it('returns scheduled for reschedule-only when published_at changes', function (): void {
        $before = PostSnapshot::make([
            'title' => 'Same',
            'body' => 'Same',
            'published_at' => now()->addWeek()->format('Y-m-d H:i:s'),
        ]);
        $after = PostSnapshot::make([
            'title' => 'Same',
            'body' => 'Same',
            'published_at' => now()->addWeeks(2)->format('Y-m-d H:i:s'),
        ]);

        expect(RecordPostRevision::reasonForStore($before, $after, promote: true, hadRevisions: true))
            ->toBe(RevisionReason::Scheduled);
    });

    it('returns scheduled only for live to scheduled multi-event store', function (): void {
        $before = PostSnapshot::make([
            'title' => 'Live',
            'body' => 'Body',
            'published_at' => now()->subDay()->format('Y-m-d H:i:s'),
        ]);
        $after = PostSnapshot::make([
            'title' => 'Live',
            'body' => 'Body',
            'published_at' => now()->addWeek()->format('Y-m-d H:i:s'),
        ]);

        expect(RecordPostRevision::reasonForStore($before, $after, promote: true, hadRevisions: true))
            ->toBe(RevisionReason::Scheduled);
    });

    it('returns updated for live promote', function (): void {
        $at = now()->subDay()->format('Y-m-d H:i:s');
        $before = PostSnapshot::make([
            'title' => 'A',
            'body' => 'One',
            'published_at' => $at,
        ]);
        $after = PostSnapshot::make([
            'title' => 'B',
            'body' => 'Two',
            'published_at' => $at,
        ]);

        expect(RecordPostRevision::reasonForStore($before, $after, promote: true, hadRevisions: true))
            ->toBe(RevisionReason::Updated);
    });

    it('returns unpublished when going live to draft', function (): void {
        $before = PostSnapshot::make([
            'title' => 'Live',
            'body' => 'Body',
            'published_at' => now()->subDay()->format('Y-m-d H:i:s'),
        ]);
        $after = PostSnapshot::make([
            'title' => 'Live',
            'body' => 'Body',
            'published_at' => null,
        ]);

        expect(RecordPostRevision::reasonForStore($before, $after, promote: true, hadRevisions: true))
            ->toBe(RevisionReason::Unpublished);
    });
});

describe('fromSnapshot equality policy', function (): void {
    it('creates a revision for origin when content is new', function (): void {
        $post = Post::factory()->create();

        $revision = RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'slug' => 'hello',
            'body' => 'Body text',
            'summary' => 'Summary',
        ], userId: 1, reason: RevisionReason::Origin);

        expect($revision)->toBeInstanceOf(PostRevision::class)
            ->and($revision->post_id)->toBe($post->id)
            ->and($revision->title)->toBe('Hello')
            ->and($revision->user_id)->toBe(1)
            ->and($revision->reason)->toBe(RevisionReason::Origin)
            ->and($post->fresh()->revisions)->toHaveCount(1);
    });

    it('skips updated when content matches latest', function (): void {
        $post = Post::factory()->create();

        RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'slug' => 'hello',
            'body' => 'Body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Origin);

        $second = RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'slug' => 'hello',
            'body' => 'Body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Updated);

        expect($second)->toBeNull()
            ->and($post->fresh()->revisions)->toHaveCount(1);
    });

    it('still creates published when content matches latest', function (): void {
        $post = Post::factory()->create();

        RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'slug' => 'hello',
            'body' => 'Body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Origin);

        $second = RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'slug' => 'hello',
            'body' => 'Body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Published);

        expect($second)->toBeInstanceOf(PostRevision::class)
            ->and($post->fresh()->revisions)->toHaveCount(2)
            ->and($second->label)->toBeNull();
    });

    it('skips empty content snapshots', function (): void {
        $post = Post::factory()->create();

        $revision = RecordPostRevision::fromSnapshot($post, [
            'title' => null,
            'body' => null,
            'summary' => null,
        ], reason: RevisionReason::Origin);

        expect($revision)->toBeNull()
            ->and($post->fresh()->revisions)->toHaveCount(0);
    });

    it('returns null when reason is null', function (): void {
        $post = Post::factory()->create();

        $revision = RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'body' => 'Body',
        ], reason: null);

        expect($revision)->toBeNull()
            ->and($post->fresh()->revisions)->toHaveCount(0);
    });

    it('prefers pending content when recording from a post', function (): void {
        $post = createPublishedPost([
            'title' => 'Live',
            'slug' => 'live',
            'body' => 'Live body',
            'pending' => [
                'title' => 'Pending',
                'slug' => 'live',
                'summary' => null,
                'body' => 'Pending body',
                'featured_image' => null,
                'featured_image_caption' => null,
                'meta' => null,
                'tags' => [],
                'topic' => null,
            ],
        ]);

        $revision = RecordPostRevision::fromPost($post, reason: RevisionReason::Restored);

        expect($revision)->not->toBeNull()
            ->and($revision?->title)->toBe('Pending')
            ->and($revision?->body)->toBe('Pending body');
    });

    it('creates manual labeled bookmark when content matches latest', function (): void {
        $post = Post::factory()->create();

        RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'slug' => 'hello',
            'body' => 'Body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Origin);

        $named = RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'slug' => 'hello',
            'body' => 'Body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Manual, label: 'Before launch');

        expect($named)->toBeInstanceOf(PostRevision::class)
            ->and($named->label)->toBe('Before launch')
            ->and($post->fresh()->revisions)->toHaveCount(2);
    });

    it('skips leave checkpoint when content matches the latest revision', function (): void {
        $post = Post::factory()->create();

        RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'slug' => 'hello',
            'body' => 'Body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Origin);

        $left = RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'slug' => 'hello',
            'body' => 'Body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Left);

        expect($left)->toBeNull()
            ->and($post->fresh()->revisions)->toHaveCount(1);
    });

    it('records leave checkpoint when content changed since the latest', function (): void {
        $post = Post::factory()->create();

        RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello',
            'slug' => 'hello',
            'body' => 'Body',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Origin);

        $left = RecordPostRevision::fromSnapshot($post, [
            'title' => 'Hello edited',
            'slug' => 'hello',
            'body' => 'Body two',
            'summary' => null,
            'featured_image' => null,
            'featured_image_caption' => null,
            'meta' => null,
        ], reason: RevisionReason::Left);

        expect($left)->toBeInstanceOf(PostRevision::class)
            ->and($left->title)->toBe('Hello edited')
            ->and($left->label)->toBeNull()
            ->and($post->fresh()->revisions)->toHaveCount(2);
    });
});
