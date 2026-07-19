<?php

use Canvas\Models\Post;
use Canvas\Support\PostSeo;

it('strips html, truncates text, and finds the first image', function (): void {
    expect(PostSeo::stripHtml('<p>Hello <em>world</em></p>'))->toBe('Hello world');
    expect(PostSeo::stripHtml(null))->toBe('');
    expect(PostSeo::truncate('one two three four five six seven eight nine ten', 20))->toBe('one two three four…');
    expect(PostSeo::truncate('short', 20))->toBe('short');
    expect(PostSeo::firstImageSrc('<p>Text</p><img src="https://example.com/a.jpg" alt="A" />'))
        ->toBe('https://example.com/a.jpg');
    expect(PostSeo::firstImageSrc('<p>No images</p>'))->toBeNull();
});

it('resolves post SEO with meta overrides', function (): void {
    $post = Post::factory()->make([
        'title' => 'Hello World',
        'slug' => 'hello-world',
        'summary' => 'A short summary',
        'body' => '<p>Body copy with <strong>formatting</strong>.</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => [
            'title' => 'SEO title',
            'description' => 'SEO description',
            'canonical_link' => 'https://example.com/custom',
        ],
    ]);

    expect(PostSeo::resolve($post, 'https://example.com/canvas-ui/hello-world'))->toBe([
        'title' => 'SEO title',
        'description' => 'SEO description',
        'canonical_url' => 'https://example.com/custom',
        'image_url' => null,
        'image_alt' => 'Hello World',
    ]);
});

it('falls back to title, summary, and reader canonical url', function (): void {
    $post = Post::factory()->make([
        'title' => 'Hello World',
        'slug' => 'hello-world',
        'summary' => 'A short summary',
        'body' => '<p>Body copy with <strong>formatting</strong>.</p>',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => null,
    ]);

    expect(PostSeo::resolve($post, 'https://example.com/canvas-ui/hello-world'))->toBe([
        'title' => 'Hello World',
        'description' => 'A short summary',
        'canonical_url' => 'https://example.com/canvas-ui/hello-world',
        'image_url' => null,
        'image_alt' => 'Hello World',
    ]);
});

it('falls back description to truncated body when summary is empty', function (): void {
    $post = Post::factory()->make([
        'title' => 'Hello World',
        'summary' => '',
        'body' => '<p>'.str_repeat('word ', 80).'</p>',
        'meta' => null,
        'featured_image' => null,
    ]);

    $resolved = PostSeo::resolve($post, 'https://example.com/p');

    expect($resolved['description'])
        ->not->toBe('No description available.')
        ->and(mb_strlen($resolved['description']))->toBeLessThanOrEqual(161);
});

it('prefers featured image over first body image', function (): void {
    $post = Post::factory()->make([
        'title' => 'Hello World',
        'summary' => 'Summary',
        'body' => '<img src="https://example.com/inline.jpg" />',
        'featured_image' => 'https://example.com/hero.jpg',
        'featured_image_caption' => 'Hero caption',
        'meta' => null,
    ]);

    $resolved = PostSeo::resolve($post, 'https://example.com/p');

    expect($resolved['image_url'])->toBe('https://example.com/hero.jpg')
        ->and($resolved['image_alt'])->toBe('Hero caption');
});

it('uses first body image when featured image is missing', function (): void {
    $post = Post::factory()->make([
        'title' => 'Hello World',
        'summary' => 'Summary',
        'body' => '<p>Hi</p><img src="https://example.com/inline.jpg" />',
        'featured_image' => null,
        'featured_image_caption' => null,
        'meta' => null,
    ]);

    expect(PostSeo::resolve($post, 'https://example.com/p')['image_url'])
        ->toBe('https://example.com/inline.jpg');
});
