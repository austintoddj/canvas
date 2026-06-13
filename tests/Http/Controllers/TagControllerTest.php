<?php

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\View;
use Illuminate\Pagination\LengthAwarePaginator;
use Ramsey\Uuid\Uuid;

it('list all tags', function (): void {
    Tag::factory()->count(2)->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/tags')
        ->assertSuccessful();

    $this->assertInstanceOf(Tag::class, $response->getOriginalContent()->first());

    $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

    $this->assertCount(2, $response->getOriginalContent());
});
it('create data for tag', function (): void {
    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/tags/create')
        ->assertSuccessful();

    $this->assertInstanceOf(Tag::class, $response->getOriginalContent());
});
it('existing tag data', function (): void {
    $tag = Tag::factory()->create();

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/tags/{$tag->id}")
        ->assertSuccessful();

    $this->assertTrue($tag->is($response->getOriginalContent()));
});
it('list posts for tag', function (): void {
    $tag = Tag::factory()->create();
    $post = Post::factory()->create();

    View::factory()->create([
        'post_id' => $post->id,
    ]);

    $tag->posts()->sync([$post->id]);

    $response = $this->actingAs($this->admin, 'canvas')
        ->getJson("canvas/api/tags/{$tag->id}/posts")
        ->assertSuccessful();

    $this->assertInstanceOf(Post::class, $response->getOriginalContent()->first());

    $this->assertInstanceOf(LengthAwarePaginator::class, $response->getOriginalContent());

    $this->assertCount(1, $response->getOriginalContent());
});
it('tag not found', function (): void {
    $this->actingAs($this->admin, 'canvas')
        ->getJson('canvas/api/tags/not-a-tag')
        ->assertNotFound();
});
it('store new tag', function (): void {
    $data = [
        'id' => Uuid::uuid4()->toString(),
        'name' => 'A new tag',
        'slug' => 'a-new-tag',
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/tags/{$data['id']}", $data)
        ->assertSuccessful();

    $this->assertInstanceOf(Tag::class, $response->getOriginalContent()->first());

    $this->assertSame($data['id'], $response->getOriginalContent()->id);
});
it('deleted tags can be refreshed', function (): void {
    $deletedTag = Tag::factory()->create([
        'id' => Uuid::uuid4()->toString(),
        'name' => 'A deleted tag',
        'slug' => 'a-deleted-tag',
        'user_id' => $this->editor->id,
        'deleted_at' => now(),
    ]);

    $data = [
        'id' => Uuid::uuid4()->toString(),
        'name' => $deletedTag->name,
        'slug' => $deletedTag->slug,
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/tags/{$data['id']}", $data)
        ->assertSuccessful();

    $this->assertInstanceOf(Tag::class, $response->getOriginalContent()->first());

    $this->assertSame($deletedTag['id'], $response->getOriginalContent()->id);
});
it('update existing tag', function (): void {
    $tag = Tag::factory()->create();

    $data = [
        'name' => 'An updated tag',
        'slug' => 'an-updated-tag',
    ];

    $response = $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/tags/{$tag->id}", $data)
        ->assertSuccessful();

    $this->assertInstanceOf(Tag::class, $response->getOriginalContent()->first());

    $this->assertSame($data['slug'], $response->getOriginalContent()->slug);
});
it('invalid slugs are validated', function (): void {
    $tag = Tag::factory()->create();

    $this->actingAs($this->admin, 'canvas')
        ->postJson("canvas/api/tags/{$tag->id}", [
            'name' => 'A new tag',
            'slug' => 'a new.slug',
        ])
        ->assertStatus(422)
        ->assertJsonStructure([
            'errors' => [
                'slug',
            ],
        ]);
});
it('delete existing tag', function (): void {
    $tag = Tag::factory()->create();

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson('canvas/api/tags/not-a-tag')
        ->assertNotFound();

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson("canvas/api/tags/{$tag->id}")
        ->assertSuccessful()
        ->assertNoContent();

    $this->assertSoftDeleted('canvas_tags', [
        'id' => $tag->id,
        'slug' => $tag->slug,
    ]);
});
it('de sync post relationship', function (): void {
    $tag = Tag::factory()->create();
    $post = Post::factory()->create();

    $tag->posts()->sync([$post->id]);

    $this->assertDatabaseHas('canvas_posts_tags', [
        'post_id' => $post->id,
        'tag_id' => $tag->id,
    ]);

    $this->assertCount(1, $tag->posts);

    $this->actingAs($this->admin, 'canvas')
        ->deleteJson("canvas/api/posts/{$post->id}")
        ->assertSuccessful()
        ->assertNoContent();

    $this->assertSoftDeleted('canvas_posts', [
        'id' => $post->id,
        'slug' => $post->slug,
    ]);

    $this->assertDatabaseMissing('canvas_posts_tags', [
        'post_id' => $post->id,
        'tag_id' => $tag->id,
    ]);

    $this->assertCount(0, $tag->refresh()->posts);
});
