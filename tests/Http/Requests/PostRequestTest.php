<?php

use Canvas\Http\Requests\PostRequest;
use Canvas\Models\Post;
use Illuminate\Support\Str;

it('requires a slug', function (): void {
    $post = Post::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        PostRequest::class,
        [],
        $this->admin,
        ['slug'],
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('requires a title when creating a post', function (): void {
    $id = (string) Str::uuid();

    assertFormRequestInvalid(
        PostRequest::class,
        ['slug' => 'new-post'],
        $this->admin,
        ['title'],
        ['id' => $id],
        "canvas/api/posts/{$id}",
    );
});

it('allows clearing the title on an existing draft', function (): void {
    $post = Post::factory()->draft()->create(['user_id' => $this->admin->id]);

    assertFormRequestValid(
        PostRequest::class,
        [
            'slug' => $post->slug,
            'title' => null,
        ],
        $this->admin,
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('rejects invalid slugs', function (): void {
    $post = Post::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        PostRequest::class,
        [
            'slug' => 'a new.slug',
            'title' => 'A new post',
        ],
        $this->admin,
        ['slug'],
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('rejects duplicate slugs for the same user', function (): void {
    $existing = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'taken-slug',
    ]);
    $post = Post::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        PostRequest::class,
        [
            'slug' => $existing->slug,
            'title' => 'Another post',
        ],
        $this->admin,
        ['slug'],
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('allows the same slug when updating the existing post', function (): void {
    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'my-slug',
        'title' => 'My post',
    ]);

    assertFormRequestValid(
        PostRequest::class,
        [
            'slug' => 'my-slug',
            'title' => 'Updated title',
        ],
        $this->admin,
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('allows the same slug for different users', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'shared-slug',
    ]);
    $post = Post::factory()->create(['user_id' => $this->editor->id]);

    assertFormRequestValid(
        PostRequest::class,
        [
            'slug' => 'shared-slug',
            'title' => 'Editor post',
        ],
        $this->editor,
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('rejects invalid published dates and meta payloads', function (): void {
    $post = Post::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        PostRequest::class,
        [
            'slug' => 'valid-slug',
            'title' => 'A new post',
            'published_at' => 'not-a-date',
            'meta' => 'not-an-array',
        ],
        $this->admin,
        ['published_at', 'meta'],
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('accepts nullable post fields', function (): void {
    $post = Post::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestValid(
        PostRequest::class,
        [
            'slug' => 'valid-slug',
            'title' => 'A new post',
            'summary' => 'Summary text',
            'body' => 'Body text',
            'published_at' => now()->toDateTimeString(),
            'featured_image' => 'https://example.com/image.jpg',
            'featured_image_caption' => 'Caption text',
            'meta' => ['title' => 'Meta title'],
        ],
        $this->admin,
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});
