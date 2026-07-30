<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\RevisionReason;
use Canvas\Models\Post;
use Canvas\Models\PostRevision;
use Illuminate\Support\Str;

/**
 * Persist full content checkpoints for editorial moments (not every autosave).
 *
 * Create triggers: origin, visibility transitions, reschedule, live Update with
 * content change, leave-editor session boundary, restore branch. See reasonForStore().
 */
final class RecordPostRevision
{
    /**
     * Classify whether a successful main-field store should create a checkpoint.
     *
     * Source of truth: before/after public snapshots. Do not map raw PostLifecycle
     * PostUpdated → Updated (scheduled content autosaves would spam history).
     */
    public static function reasonForStore(
        ?PostSnapshot $before,
        PostSnapshot $after,
        bool $promote,
        bool $hadRevisions,
    ): ?RevisionReason {
        $from = $before?->visibility() ?? 'draft';
        $to = $after->visibility();

        if ($from !== $to) {
            return self::reasonForVisibilityChange($from, $to);
        }

        if (
            $from === 'scheduled'
            && $before !== null
            && $before->publishedAt !== $after->publishedAt
        ) {
            return RevisionReason::Scheduled;
        }

        if ($promote && $to === 'live') {
            return RevisionReason::Updated;
        }

        if (! $hadRevisions) {
            return RevisionReason::Origin;
        }

        return null;
    }

    /**
     * @param  array{
     *     title?: mixed,
     *     slug?: mixed,
     *     summary?: mixed,
     *     body?: mixed,
     *     featured_image?: mixed,
     *     featured_image_caption?: mixed,
     *     meta?: mixed
     * }  $snapshot
     */
    public static function fromSnapshot(
        Post $post,
        array $snapshot,
        ?int $userId = null,
        ?RevisionReason $reason = null,
        ?string $label = null,
    ): ?PostRevision {
        if ($reason === null) {
            return null;
        }

        $normalized = self::normalize($snapshot);

        if ($normalized['title'] === null && $normalized['body'] === null && $normalized['summary'] === null) {
            return null;
        }

        $latest = $post->revisions()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();

        $matchesLatest = $latest instanceof PostRevision && self::matchesRevision($latest, $normalized);

        if ($matchesLatest && self::shouldSkipContentMatch($reason, $label)) {
            return null;
        }

        $resolvedLabel = self::resolveUserLabel($label);

        return $post->revisions()->create([
            'id' => (string) Str::orderedUuid(),
            'user_id' => $userId,
            'label' => $resolvedLabel,
            'title' => $normalized['title'],
            'slug' => $normalized['slug'],
            'summary' => $normalized['summary'],
            'body' => $normalized['body'],
            'featured_image' => $normalized['featured_image'],
            'featured_image_caption' => $normalized['featured_image_caption'],
            'meta' => $normalized['meta'],
        ]);
    }

    /**
     * Capture editor-visible content (pending wins when set).
     */
    public static function fromPost(
        Post $post,
        ?int $userId = null,
        ?RevisionReason $reason = null,
        ?string $label = null,
    ): ?PostRevision {
        if ($reason === null) {
            return null;
        }

        if ($post->has_pending_changes && is_array($post->pending)) {
            /** @var array<string, mixed> $pending */
            $pending = $post->pending;

            return self::fromSnapshot($post, $pending, $userId, $reason, $label);
        }

        return self::fromSnapshot($post, [
            'title' => $post->title,
            'slug' => $post->slug,
            'summary' => $post->summary,
            'body' => $post->body,
            'featured_image' => $post->featured_image,
            'featured_image_caption' => $post->featured_image_caption,
            'meta' => $post->meta,
        ], $userId, $reason, $label);
    }

    /**
     * End-state wins for multi-event stores (e.g. live→scheduled → Scheduled only).
     */
    private static function reasonForVisibilityChange(string $from, string $to): ?RevisionReason
    {
        return match (true) {
            $to === 'live' => RevisionReason::Published,
            $to === 'scheduled' => RevisionReason::Scheduled,
            $to === 'draft' && ($from === 'live' || $from === 'scheduled') => RevisionReason::Unpublished,
            default => null,
        };
    }

    /**
     * Lifecycle + restore never skip on content match; origin/updated/leave/unlabeled manual do.
     */
    private static function shouldSkipContentMatch(RevisionReason $reason, ?string $label): bool
    {
        return match ($reason) {
            RevisionReason::Published,
            RevisionReason::Scheduled,
            RevisionReason::Unpublished,
            RevisionReason::Restored => false,
            // Named pin while content matches latest still records; unlabeled leave/manual do not.
            RevisionReason::Manual,
            RevisionReason::Left => $label === null || trim($label) === '',
            RevisionReason::Origin,
            RevisionReason::Updated => true,
        };
    }

    /**
     * Persist only user-provided names. Lifecycle auto-labels are not stored —
     * the list shows date/time unless `label` is set (rename / named save).
     */
    private static function resolveUserLabel(?string $label): ?string
    {
        if (! is_string($label)) {
            return null;
        }

        $trimmed = trim($label);

        return $trimmed === '' ? null : $trimmed;
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return array{
     *     title: string|null,
     *     slug: string|null,
     *     summary: string|null,
     *     body: string|null,
     *     featured_image: string|null,
     *     featured_image_caption: string|null,
     *     meta: array<string, mixed>|null
     * }
     */
    private static function normalize(array $snapshot): array
    {
        $meta = $snapshot['meta'] ?? null;
        if (! is_array($meta)) {
            $meta = null;
        }

        return [
            'title' => self::nullableString($snapshot['title'] ?? null),
            'slug' => self::nullableString($snapshot['slug'] ?? null),
            'summary' => self::nullableString($snapshot['summary'] ?? null),
            'body' => self::nullableString($snapshot['body'] ?? null),
            'featured_image' => self::nullableString($snapshot['featured_image'] ?? null),
            'featured_image_caption' => self::nullableString($snapshot['featured_image_caption'] ?? null),
            'meta' => $meta,
        ];
    }

    /**
     * @param  array{
     *     title: string|null,
     *     slug: string|null,
     *     summary: string|null,
     *     body: string|null,
     *     featured_image: string|null,
     *     featured_image_caption: string|null,
     *     meta: array<string, mixed>|null
     * }  $normalized
     */
    private static function matchesRevision(PostRevision $revision, array $normalized): bool
    {
        return self::nullableString($revision->title) === $normalized['title']
            && self::nullableString($revision->slug) === $normalized['slug']
            && self::nullableString($revision->summary) === $normalized['summary']
            && self::nullableString($revision->body) === $normalized['body']
            && self::nullableString($revision->featured_image) === $normalized['featured_image']
            && self::nullableString($revision->featured_image_caption) === $normalized['featured_image_caption']
            && self::metaEquals($revision->meta, $normalized['meta']);
    }

    private static function metaEquals(mixed $left, mixed $right): bool
    {
        if ($left === null || $left === []) {
            return $right === null || $right === [];
        }

        if ($right === null || $right === []) {
            return false;
        }

        if (! is_array($left) || ! is_array($right)) {
            return $left === $right;
        }

        return self::normalizeAssociative($left) === self::normalizeAssociative($right);
    }

    /**
     * @param  array<string, mixed>  $value
     * @return array<string, mixed>
     */
    private static function normalizeAssociative(array $value): array
    {
        ksort($value);

        foreach ($value as $key => $item) {
            if (is_array($item)) {
                /** @var array<string, mixed> $item */
                $value[$key] = self::normalizeAssociative($item);
            } elseif ($item === '') {
                $value[$key] = null;
            }
        }

        return $value;
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_scalar($value)) {
            return null;
        }

        $string = (string) $value;

        return $string === '' ? null : $string;
    }
}
