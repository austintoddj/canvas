<?php

use Canvas\Models\Post;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

it('lists all topics', function (): void {
    Topic::factory()->count(2)->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/topics')
        ->assertSuccessful();

    $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

    $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

    $this->assertCount(2, $response->getOriginalContent());
});

it('filters topics by search and sorts by name', function (): void {
    Topic::factory()->create(['name' => 'Zebra', 'slug' => 'zebra']);
    Topic::factory()->create(['name' => 'Alpha Notes', 'slug' => 'alpha-notes']);
    Topic::factory()->create(['name' => 'Beta', 'slug' => 'beta']);

    $search = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/topics?search=Alpha')
        ->assertSuccessful()
        ->getOriginalContent();

    expect($search)->toHaveCount(1);
    expect($search->first()->name)->toBe('Alpha Notes');

    $sorted = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/topics?sort=name')
        ->assertSuccessful()
        ->getOriginalContent();

    expect($sorted->pluck('name')->all())->toBe(['Alpha Notes', 'Beta', 'Zebra']);
});
it('returns data for creating a topic', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/topics/create')
        ->assertSuccessful();

    $this->assertInstanceOf(Topic::class, $response->getOriginalContent());
});
it('returns existing topic data', function (): void {
    $topic = Topic::factory()->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/topics/{$topic->id}")
        ->assertSuccessful();

    $this->assertTrue($topic->is($response->getOriginalContent()));
});
it('lists posts for a topic', function (): void {
    $topic = Topic::factory()->create();
    $post = Post::factory()->create(['topic_id' => $topic->id]);

    View::factory()->create([
        'post_id' => $post->id,
    ]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/topics/{$topic->id}/posts")
        ->assertSuccessful();

    $this->assertInstanceOf(Post::class, $response->getOriginalContent()->first());

    $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

    $this->assertCount(1, $response->getOriginalContent());
});
it('returns not found for unknown topics', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/topics/not-a-topic')
        ->assertNotFound();
});
it('stores a new topic', function (): void {
    $data = [
        'id' => (string) Str::uuid(),
        'name' => 'A new topic',
        'slug' => 'a-new-topic',
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/topics/{$data['id']}", $data)
        ->assertCreated();

    $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

    $this->assertSame($data['id'], $response->getOriginalContent()->id);
});
it('restores deleted topics when refreshed', function (): void {
    $deletedTopic = Topic::factory()->create([
        'id' => (string) Str::uuid(),
        'name' => 'A deleted topic',
        'slug' => 'a-deleted-topic',
        'user_id' => $this->editor->id,
        'deleted_at' => now(),
    ]);

    $data = [
        'id' => (string) Str::uuid(),
        'name' => $deletedTopic->name,
        'slug' => $deletedTopic->slug,
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/topics/{$data['id']}", $data)
        ->assertCreated();

    $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

    $this->assertSame($deletedTopic['id'], $response->getOriginalContent()->id);
});
it('updates an existing topic', function (): void {
    $topic = Topic::factory()->create();

    $data = [
        'name' => 'An updated topic',
        'slug' => 'an-updated-topic',
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/topics/{$topic->id}", $data)
        ->assertOk();

    $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

    $this->assertSame($data['slug'], $response->getOriginalContent()->slug);
});
it('invalid slugs are validated', function (): void {
    $topic = Topic::factory()->create();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/topics/{$topic->id}", [
            'name' => 'A new topic',
            'slug' => 'a new.slug',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['slug']);
});
it('returns not found when deleting unknown topics', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->deleteJson('canvas/api/topics/not-a-topic')
        ->assertNotFound();
});

it('deletes an existing topic', function (): void {
    $topic = Topic::factory()->create();

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson("canvas/api/topics/{$topic->id}")
        ->assertSuccessful()
        ->assertNoContent();

    $this->assertSoftDeleted('canvas_topics', [
        'id' => $topic->id,
        'slug' => $topic->slug,
    ]);
});
it('desyncs the post relationship', function (): void {
    $topic = Topic::factory()->create();
    $post = Post::factory()->create(['topic_id' => $topic->id]);

    $this->assertDatabaseHas('canvas_posts', [
        'id' => $post->id,
        'topic_id' => $topic->id,
    ]);

    $this->assertCount(1, $topic->posts);

    $topic->delete();

    $this->assertDatabaseHas('canvas_posts', [
        'id' => $post->id,
        'topic_id' => null,
    ]);

    $this->assertCount(0, $topic->refresh()->posts);
});
