<?php

use Canvas\Enums\WebhookEvent;
use Canvas\Support\PostLifecycle;
use Canvas\Support\PostSnapshot;
use Illuminate\Support\Carbon;

/**
 * Frozen clock for deterministic live vs scheduled classification.
 * Snapshots must be built after this runs (lazy datasets / test bodies).
 */
beforeEach(function (): void {
    Carbon::setTestNow('2026-07-22 12:00:00');
});

afterEach(function (): void {
    Carbon::setTestNow();
});

/**
 * @return list<string>
 */
function eventValues(array $events): array
{
    return array_map(
        static fn (WebhookEvent $event): string => $event->value,
        $events,
    );
}

function draftSnapshot(array $overrides = []): PostSnapshot
{
    return PostSnapshot::make(array_merge([
        'title' => 'Draft post',
        'slug' => 'draft-post',
        'published_at' => null,
    ], $overrides));
}

function liveSnapshot(array $overrides = []): PostSnapshot
{
    return PostSnapshot::make(array_merge([
        'title' => 'Live post',
        'slug' => 'live-post',
        // Relative to Carbon::setTestNow so visibility never depends on the calendar.
        'published_at' => now()->subDays(2)->format('Y-m-d H:i:s'),
    ], $overrides));
}

function scheduledSnapshot(array $overrides = []): PostSnapshot
{
    return PostSnapshot::make(array_merge([
        'title' => 'Scheduled post',
        'slug' => 'scheduled-post',
        'published_at' => now()->addWeek()->format('Y-m-d H:i:s'),
    ], $overrides));
}

it('classifies public lifecycle transitions', function (?PostSnapshot $before, ?PostSnapshot $after, bool $deleted, array $expected): void {
    $events = PostLifecycle::classify($before, $after, $deleted);

    expect(eventValues($events))->toBe($expected);
})->with([
    // Closures: Pest evaluates datasets at load time; PostSnapshot bakes visibility from now().
    'absent to draft emits nothing' => fn (): array => [
        null,
        draftSnapshot(),
        false,
        [],
    ],
    'draft to draft emits nothing' => fn (): array => [
        draftSnapshot(['title' => 'A']),
        draftSnapshot(['title' => 'B']),
        false,
        [],
    ],
    'absent to live emits published' => fn (): array => [
        null,
        liveSnapshot(),
        false,
        ['post.published'],
    ],
    'draft to live emits published' => fn (): array => [
        draftSnapshot(),
        liveSnapshot(),
        false,
        ['post.published'],
    ],
    'absent to scheduled emits scheduled' => fn (): array => [
        null,
        scheduledSnapshot(),
        false,
        ['post.scheduled'],
    ],
    'draft to scheduled emits scheduled' => fn (): array => [
        draftSnapshot(),
        scheduledSnapshot(),
        false,
        ['post.scheduled'],
    ],
    'scheduled to live emits published' => fn (): array => [
        scheduledSnapshot(),
        liveSnapshot(['title' => 'Scheduled post', 'slug' => 'scheduled-post']),
        false,
        ['post.published'],
    ],
    'scheduled to scheduled with content change emits updated' => fn (): array => [
        scheduledSnapshot(['title' => 'Before']),
        scheduledSnapshot(['title' => 'After']),
        false,
        ['post.updated'],
    ],
    'scheduled to scheduled with only schedule shift emits updated' => fn (): array => [
        scheduledSnapshot(['published_at' => now()->addWeek()->format('Y-m-d H:i:s')]),
        scheduledSnapshot(['published_at' => now()->addWeeks(2)->format('Y-m-d H:i:s')]),
        false,
        ['post.updated'],
    ],
    'scheduled to scheduled no-op emits nothing' => fn (): array => [
        scheduledSnapshot(),
        scheduledSnapshot(),
        false,
        [],
    ],
    'scheduled to draft emits unpublished' => fn (): array => [
        scheduledSnapshot(),
        draftSnapshot(['title' => 'Scheduled post', 'slug' => 'scheduled-post']),
        false,
        ['post.unpublished'],
    ],
    'live to live with content change emits updated' => fn (): array => [
        liveSnapshot(['title' => 'Before']),
        liveSnapshot(['title' => 'After']),
        false,
        ['post.updated'],
    ],
    'live to live no-op emits nothing' => fn (): array => [
        liveSnapshot(),
        liveSnapshot(),
        false,
        [],
    ],
    'live to draft emits unpublished' => fn (): array => [
        liveSnapshot(),
        draftSnapshot(['title' => 'Live post', 'slug' => 'live-post']),
        false,
        ['post.unpublished'],
    ],
    'live to scheduled emits unpublished then scheduled' => fn (): array => [
        liveSnapshot(),
        scheduledSnapshot(['title' => 'Live post', 'slug' => 'live-post']),
        false,
        ['post.unpublished', 'post.scheduled'],
    ],
    'delete emits deleted regardless of before snapshot' => fn (): array => [
        liveSnapshot(),
        null,
        true,
        ['post.deleted'],
    ],
    'delete with draft before still emits deleted' => fn (): array => [
        draftSnapshot(),
        null,
        true,
        ['post.deleted'],
    ],
    'null after without delete emits nothing' => fn (): array => [
        liveSnapshot(),
        null,
        false,
        [],
    ],
]);

it('treats body and taxonomy fingerprint changes as updates while live', function (): void {
    $before = liveSnapshot([
        'body' => 'Old body',
        'tag_slugs' => ['alpha'],
        'topic_id' => 'topic-a',
    ]);
    $after = liveSnapshot([
        'body' => 'New body',
        'tag_slugs' => ['alpha', 'beta'],
        'topic_id' => 'topic-b',
    ]);

    expect(eventValues(PostLifecycle::classify($before, $after)))->toBe(['post.updated']);
});

it('does not emit updated when only non-fingerprint identity would differ and fields match', function (): void {
    $before = liveSnapshot([
        'meta' => ['title' => 'SEO', 'description' => 'A'],
    ]);
    $after = liveSnapshot([
        'meta' => ['description' => 'A', 'title' => 'SEO'],
    ]);

    expect(eventValues(PostLifecycle::classify($before, $after)))->toBe([]);
});
