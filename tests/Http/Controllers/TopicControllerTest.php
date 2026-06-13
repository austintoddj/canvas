<?php

use Canvas\Models\Post;
use Canvas\Models\Topic;
use Canvas\Models\View;
use Illuminate\Pagination\LengthAwarePaginator;
use Ramsey\Uuid\Uuid;

it('list all topics', function (): void {
    Topic::factory()->count(2)->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/topics')
        ->assertSuccessful();

    $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

    $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

    $this->assertCount(2, $response->getOriginalContent());
});
it('create data for topic', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/topics/create')
        ->assertSuccessful();

    $this->assertInstanceOf(Topic::class, $response->getOriginalContent());
});
it('existing topic data', function (): void {
    $topic = Topic::factory()->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/topics/{$topic->id}")
        ->assertSuccessful();

    $this->assertTrue($topic->is($response->getOriginalContent()));
});
it('list posts for topic', function (): void {
    $topic = Topic::factory()->create();
    $post = Post::factory()->create();

    View::factory()->create([
        'post_id' => $post->id,
    ]);

    $topic->posts()->sync([$post->id]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/topics/{$topic->id}/posts")
        ->assertSuccessful();

    $this->assertInstanceOf(Post::class, $response->getOriginalContent()->first());

    $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

    $this->assertCount(1, $response->getOriginalContent());
});
it('topic not found', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/topics/not-a-topic')
        ->assertNotFound();
});
it('store new topic', function (): void {
    $data = [
        'id' => Uuid::uuid4()->toString(),
        'name' => 'A new topic',
        'slug' => 'a-new-topic',
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/topics/{$data['id']}", $data)
        ->assertSuccessful();

    $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

    $this->assertSame($data['id'], $response->getOriginalContent()->id);
});
it('deleted topics can be refreshed', function (): void {
    $deletedTopic = Topic::factory()->create([
        'id' => Uuid::uuid4()->toString(),
        'name' => 'A deleted topic',
        'slug' => 'a-deleted-topic',
        'user_id' => $this->editor->id,
        'deleted_at' => now(),
    ]);

    $data = [
        'id' => Uuid::uuid4()->toString(),
        'name' => $deletedTopic->name,
        'slug' => $deletedTopic->slug,
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/topics/{$data['id']}", $data)
        ->assertSuccessful();

    $this->assertInstanceOf(Topic::class, $response->getOriginalContent()->first());

    $this->assertSame($deletedTopic['id'], $response->getOriginalContent()->id);
});
it('update existing topic', function (): void {
    $topic = Topic::factory()->create();

    $data = [
        'name' => 'An updated topic',
        'slug' => 'an-updated-topic',
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/topics/{$topic->id}", $data)
        ->assertSuccessful();

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
        ->assertStatus(422)
        ->assertJsonStructure([
            'errors' => [
                'slug',
            ],
        ]);
});
it('delete existing topic', function (): void {
    $topic = Topic::factory()->create();

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson('canvas/api/topics/not-a-topic')
        ->assertNotFound();

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson("canvas/api/topics/{$topic->id}")
        ->assertSuccessful()
        ->assertNoContent();

    $this->assertSoftDeleted('canvas_topics', [
        'id' => $topic->id,
        'slug' => $topic->slug,
    ]);
});
it('de sync post relationship', function (): void {
    $topic = Topic::factory()->create();
    $post = Post::factory()->create();

    $topic->posts()->sync([$post->id]);

    $this->assertDatabaseHas('canvas_posts_topics', [
        'post_id' => $post->id,
        'topic_id' => $topic->id,
    ]);

    $this->assertCount(1, $topic->posts);

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson("canvas/api/posts/{$post->id}")
        ->assertSuccessful()
        ->assertNoContent();

    $this->assertSoftDeleted('canvas_posts', [
        'id' => $post->id,
        'slug' => $post->slug,
    ]);

    $this->assertDatabaseMissing('canvas_posts_topics', [
        'post_id' => $post->id,
        'topic_id' => $topic->id,
    ]);

    $this->assertCount(0, $topic->refresh()->posts);
});
