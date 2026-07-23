<?php

use Canvas\Enums\WebhookEvent;
use Canvas\Support\PostLifecycle;
use Canvas\Support\PostSnapshot;
use Illuminate\Support\Carbon;

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
        'published_at' => '2026-07-20 09:00:00',
    ], $overrides));
}

function scheduledSnapshot(array $overrides = []): PostSnapshot
{
    return PostSnapshot::make(array_merge([
        'title' => 'Scheduled post',
        'slug' => 'scheduled-post',
        'published_at' => '2026-07-29 09:00:00',
    ], $overrides));
}

it('classifies public lifecycle transitions', function (?PostSnapshot $before, ?PostSnapshot $after, bool $deleted, array $expected): void {
    $events = PostLifecycle::classify($before, $after, $deleted);

    expect(eventValues($events))->toBe($expected);
})->with([
    'absent to draft emits nothing' => [
        null,
        draftSnapshot(),
        false,
        [],
    ],
    'draft to draft emits nothing' => [
        draftSnapshot(['title' => 'A']),
        draftSnapshot(['title' => 'B']),
        false,
        [],
    ],
    'absent to live emits published' => [
        null,
        liveSnapshot(),
        false,
        ['post.published'],
    ],
    'draft to live emits published' => [
        draftSnapshot(),
        liveSnapshot(),
        false,
        ['post.published'],
    ],
    'absent to scheduled emits scheduled' => [
        null,
        scheduledSnapshot(),
        false,
        ['post.scheduled'],
    ],
    'draft to scheduled emits scheduled' => [
        draftSnapshot(),
        scheduledSnapshot(),
        false,
        ['post.scheduled'],
    ],
    'scheduled to live emits published' => [
        scheduledSnapshot(),
        liveSnapshot(['title' => 'Scheduled post', 'slug' => 'scheduled-post']),
        false,
        ['post.published'],
    ],
    'scheduled to scheduled with content change emits updated' => [
        scheduledSnapshot(['title' => 'Before']),
        scheduledSnapshot(['title' => 'After']),
        false,
        ['post.updated'],
    ],
    'scheduled to scheduled with only schedule shift emits updated' => [
        scheduledSnapshot(['published_at' => '2026-07-29 09:00:00']),
        scheduledSnapshot(['published_at' => '2026-07-30 09:00:00']),
        false,
        ['post.updated'],
    ],
    'scheduled to scheduled no-op emits nothing' => [
        scheduledSnapshot(),
        scheduledSnapshot(),
        false,
        [],
    ],
    'scheduled to draft emits unpublished' => [
        scheduledSnapshot(),
        draftSnapshot(['title' => 'Scheduled post', 'slug' => 'scheduled-post']),
        false,
        ['post.unpublished'],
    ],
    'live to live with content change emits updated' => [
        liveSnapshot(['title' => 'Before']),
        liveSnapshot(['title' => 'After']),
        false,
        ['post.updated'],
    ],
    'live to live no-op emits nothing' => [
        liveSnapshot(),
        liveSnapshot(),
        false,
        [],
    ],
    'live to draft emits unpublished' => [
        liveSnapshot(),
        draftSnapshot(['title' => 'Live post', 'slug' => 'live-post']),
        false,
        ['post.unpublished'],
    ],
    'live to scheduled emits unpublished then scheduled' => [
        liveSnapshot(),
        scheduledSnapshot(['title' => 'Live post', 'slug' => 'live-post']),
        false,
        ['post.unpublished', 'post.scheduled'],
    ],
    'delete emits deleted regardless of before snapshot' => [
        liveSnapshot(),
        null,
        true,
        ['post.deleted'],
    ],
    'delete with draft before still emits deleted' => [
        draftSnapshot(),
        null,
        true,
        ['post.deleted'],
    ],
    'null after without delete emits nothing' => [
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
