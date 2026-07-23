<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Support\PostSnapshot;
use Illuminate\Support\Carbon;

beforeEach(function (): void {
    Carbon::setTestNow('2026-07-22 12:00:00');
});

afterEach(function (): void {
    Carbon::setTestNow();
});

it('classifies draft, scheduled, and live visibility', function (): void {
    $draft = PostSnapshot::make(['published_at' => null, 'title' => 'Draft']);
    $scheduled = PostSnapshot::make(['published_at' => '2026-07-29 09:00:00', 'title' => 'Soon']);
    $live = PostSnapshot::make(['published_at' => '2026-07-21 09:00:00', 'title' => 'Live']);

    expect($draft->isDraft)->toBeTrue()
        ->and($draft->isLive)->toBeFalse()
        ->and($draft->isScheduled)->toBeFalse()
        ->and($draft->visibility())->toBe('draft');

    expect($scheduled->isScheduled)->toBeTrue()
        ->and($scheduled->isLive)->toBeFalse()
        ->and($scheduled->visibility())->toBe('scheduled');

    expect($live->isLive)->toBeTrue()
        ->and($live->isScheduled)->toBeFalse()
        ->and($live->visibility())->toBe('live');
});

it('builds a snapshot from an eloquent post including taxonomy', function (): void {
    $topic = Topic::factory()->create(['slug' => 'news', 'name' => 'News']);
    $alpha = Tag::factory()->create(['slug' => 'alpha', 'name' => 'Alpha']);
    $beta = Tag::factory()->create(['slug' => 'beta', 'name' => 'Beta']);

    $post = Post::factory()->create([
        'title' => 'Hello',
        'slug' => 'hello',
        'summary' => 'Summary',
        'body' => 'Body',
        'published_at' => now()->subDay(),
        'topic_id' => $topic->id,
        'meta' => ['title' => 'SEO', 'description' => 'Desc'],
    ]);
    $post->tags()->sync([$beta->id, $alpha->id]);

    $snapshot = PostSnapshot::from($post->fresh(['tags', 'topic']));

    expect($snapshot->isLive)->toBeTrue()
        ->and($snapshot->title)->toBe('Hello')
        ->and($snapshot->slug)->toBe('hello')
        ->and($snapshot->topicId)->toBe((string) $topic->id)
        ->and($snapshot->tagSlugs)->toBe(['alpha', 'beta'])
        ->and($snapshot->meta)->toMatchArray([
            'description' => 'Desc',
            'title' => 'SEO',
        ]);
});

it('treats fingerprints as equal when public fields match regardless of tag order', function (): void {
    $left = PostSnapshot::make([
        'title' => 'Same',
        'slug' => 'same',
        'published_at' => '2026-07-20 10:00:00',
        'tag_slugs' => ['b', 'a'],
        'meta' => ['z' => 1, 'a' => 2],
    ]);
    $right = PostSnapshot::make([
        'title' => 'Same',
        'slug' => 'same',
        'published_at' => '2026-07-20 10:00:00',
        'tag_slugs' => ['a', 'b'],
        'meta' => ['a' => 2, 'z' => 1],
    ]);

    expect($left->fingerprintEquals($right))->toBeTrue();
});

it('detects fingerprint changes when title changes', function (): void {
    $before = PostSnapshot::make([
        'title' => 'Before',
        'published_at' => '2026-07-20 10:00:00',
    ]);
    $after = PostSnapshot::make([
        'title' => 'After',
        'published_at' => '2026-07-20 10:00:00',
    ]);

    expect($before->fingerprintEquals($after))->toBeFalse();
});
