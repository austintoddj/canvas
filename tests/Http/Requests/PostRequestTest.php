<?php

use Canvas\Http\Requests\PostRequest;
use Canvas\Models\Post;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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

it('allows creating a draft without a title', function (): void {
    $id = (string) Str::uuid();

    assertFormRequestValid(
        PostRequest::class,
        ['slug' => 'new-post', 'title' => null],
        $this->admin,
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

// Regression: public URLs address posts by slug alone, so a second author cannot take one.
it('rejects a slug another author already uses', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'shared-slug',
    ]);
    $post = Post::factory()->create(['user_id' => $this->editor->id]);

    $request = makeFormRequest(
        PostRequest::class,
        [
            'slug' => 'shared-slug',
            'title' => 'Editor post',
        ],
        $this->editor,
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );

    try {
        $request->validateResolved();

        expect(false)->toBeTrue('Expected validation to fail.');
    } catch (ValidationException $exception) {
        expect($exception->errors()['slug'][0])
            ->toBe((string) trans('canvas::app.editor.slug_taken', [], 'en'));
    }
})->group('database');

it('translates the shared slug validation message for the author locale', function (): void {
    $this->editor->canvasUser->update(['locale' => 'de']);
    $this->editor->unsetRelation('canvasUser');

    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'shared-slug',
    ]);
    $post = Post::factory()->create(['user_id' => $this->editor->id]);

    $request = makeFormRequest(
        PostRequest::class,
        [
            'slug' => 'shared-slug',
            'title' => 'Editor post',
        ],
        $this->editor,
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );

    try {
        $request->validateResolved();

        expect(false)->toBeTrue('Expected validation to fail.');
    } catch (ValidationException $exception) {
        expect($exception->errors()['slug'][0])
            ->toBe((string) trans('canvas::app.editor.slug_taken', [], 'de'));
    }
});

it('rejects a new post slug another author already uses', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'shared-slug',
    ]);
    $id = (string) Str::uuid();

    assertFormRequestInvalid(
        PostRequest::class,
        [
            'slug' => 'shared-slug',
            'title' => 'Editor post',
        ],
        $this->editor,
        ['slug'],
        ['id' => $id],
        "canvas/api/posts/{$id}",
    );
})->group('database');

it('allows a post to keep a slug another author already uses', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'shared-slug',
    ]);
    $post = Post::factory()->create([
        'user_id' => $this->editor->id,
        'slug' => 'shared-slug',
    ]);

    assertFormRequestValid(
        PostRequest::class,
        [
            'slug' => 'shared-slug',
            'title' => 'Updated title',
        ],
        $this->editor,
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
})->group('database');

it('rejects renaming a post onto another author slug', function (): void {
    Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'taken-slug',
    ]);
    $post = Post::factory()->create([
        'user_id' => $this->editor->id,
        'slug' => 'editor-slug',
    ]);

    assertFormRequestInvalid(
        PostRequest::class,
        [
            'slug' => 'taken-slug',
            'title' => 'Editor post',
        ],
        $this->editor,
        ['slug'],
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('allows a slug that only a soft-deleted post still holds', function (): void {
    $existing = Post::factory()->create([
        'user_id' => $this->admin->id,
        'slug' => 'recycled-slug',
    ]);
    $existing->delete();

    $post = Post::factory()->create(['user_id' => $this->editor->id]);

    assertFormRequestValid(
        PostRequest::class,
        [
            'slug' => 'recycled-slug',
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
            'published_at' => now()->toIso8601String(),
            'featured_image' => 'https://example.com/image.jpg',
            'featured_image_caption' => 'Caption text',
            'meta' => ['title' => 'Meta title'],
        ],
        $this->admin,
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('accepts unsplash featured image urls that exceed a legacy string column', function (): void {
    // Regression: GH-1537 — Unsplash ixid links are longer than varchar(191) and varchar(255).
    $post = Post::factory()->create(['user_id' => $this->admin->id]);
    $url = longUnsplashFeaturedImageUrl();

    expect(strlen($url))->toBeGreaterThan(255);

    assertFormRequestValid(
        PostRequest::class,
        [
            'slug' => 'valid-slug',
            'title' => 'A new post',
            'featured_image' => $url,
        ],
        $this->admin,
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('rejects featured image urls beyond the column limit', function (): void {
    $post = Post::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestInvalid(
        PostRequest::class,
        [
            'slug' => 'valid-slug',
            'title' => 'A new post',
            'featured_image' => str_repeat('a', Post::FEATURED_IMAGE_MAX_LENGTH + 1),
        ],
        $this->admin,
        ['featured_image'],
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});

it('accepts root-relative public storage featured images', function (): void {
    $post = Post::factory()->create(['user_id' => $this->admin->id]);

    assertFormRequestValid(
        PostRequest::class,
        [
            'slug' => 'valid-slug',
            'title' => 'A new post',
            'featured_image' => '/storage/canvas/images/hero.jpg',
        ],
        $this->admin,
        ['id' => $post->id],
        "canvas/api/posts/{$post->id}",
    );
});
