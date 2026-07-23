<?php

use Canvas\Http\Requests\TopicRequest;
use Canvas\Models\Topic;

it('requires a name and slug', function (): void {
    $topic = Topic::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        TopicRequest::class,
        [],
        $this->admin,
        ['name', 'slug'],
        uri: "canvas/api/topics/{$topic->id}",
    );
});

it('rejects invalid slugs', function (): void {
    $topic = Topic::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        TopicRequest::class,
        [
            'name' => 'A new topic',
            'slug' => 'a new.slug',
        ],
        $this->admin,
        ['slug'],
        uri: "canvas/api/topics/{$topic->id}",
    );
});

it('rejects duplicate slugs for the same user', function (): void {
    $existing = Topic::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'taken-topic',
    ]);
    $topic = Topic::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        TopicRequest::class,
        [
            'name' => 'Another topic',
            'slug' => $existing->slug,
        ],
        $this->admin,
        ['slug'],
        uri: "canvas/api/topics/{$topic->id}",
    );
});

it('allows taxonomy managers to save topics', function (): void {
    $topic = Topic::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestValid(
        TopicRequest::class,
        [
            'name' => 'Updated topic',
            'slug' => 'updated-topic',
        ],
        $this->admin,
        uri: "canvas/api/topics/{$topic->id}",
    );
});

it('denies contributors from managing topics', function (): void {
    $topic = Topic::factory()->create(['user_id' => $this->contributor->id]);

    assertFormRequestUnauthorized(
        TopicRequest::class,
        [
            'name' => 'Contributor topic',
            'slug' => 'contributor-topic',
        ],
        $this->contributor,
        uri: "canvas/api/topics/{$topic->id}",
    );
});
