<?php

use Canvas\Enums\WebhookEvent;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Support\WebhookPayload;
use Illuminate\Support\Carbon;

beforeEach(function (): void {
    Carbon::setTestNow('2026-07-22 15:04:05');
});

afterEach(function (): void {
    Carbon::setTestNow();
});

it('builds a versioned post envelope without the body field', function (): void {
    $topic = Topic::factory()->create(['name' => 'News', 'slug' => 'news']);
    $tag = Tag::factory()->create(['name' => 'Laravel', 'slug' => 'laravel']);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'title' => 'Hello webhooks',
        'slug' => 'hello-webhooks',
        'summary' => 'A summary',
        'body' => '<p>Secret body that must not ship</p>',
        'published_at' => now()->subDay(),
        'topic_id' => $topic->id,
        'meta' => [
            'title' => 'SEO title',
            'description' => 'SEO description',
        ],
    ]);
    $post->tags()->sync([$tag->id]);

    $payload = WebhookPayload::forPost(
        WebhookEvent::PostPublished,
        $post->fresh(['tags', 'topic', 'user']),
        'delivery-123',
    );

    expect($payload['api_version'])->toBe(1)
        ->and($payload['event'])->toBe('post.published')
        ->and($payload['delivery_id'])->toBe('delivery-123')
        ->and($payload['created_at'])->toBe('2026-07-22T15:04:05+00:00')
        ->and($payload['data'])->toHaveKeys([
            'id', 'slug', 'title', 'summary', 'published_at', 'featured_image',
            'featured_image_caption', 'meta', 'topic', 'tags', 'author', 'created_at', 'updated_at',
        ])
        ->and($payload['data'])->not->toHaveKey('body')
        ->and($payload['data']['title'])->toBe('Hello webhooks')
        ->and($payload['data']['slug'])->toBe('hello-webhooks')
        ->and($payload['data']['topic'])->toMatchArray(['name' => 'News', 'slug' => 'news'])
        ->and($payload['data']['tags'])->toBe([['name' => 'Laravel', 'slug' => 'laravel']])
        ->and($payload['data']['author'])->toMatchArray([
            'id' => $this->admin->id,
            'name' => $this->admin->name,
        ])
        ->and(json_encode($payload))->not->toContain('Secret body');
});

it('builds a minimal test payload', function (): void {
    $payload = WebhookPayload::test('test-delivery');

    expect($payload)->toMatchArray([
        'api_version' => 1,
        'event' => 'webhook.test',
        'delivery_id' => 'test-delivery',
        'data' => [
            'ok' => true,
            'message' => 'Canvas webhook test',
        ],
    ]);
});

it('absolute-izes public storage featured images for external consumers', function (): void {
    config(['app.url' => 'http://blog.test']);

    $post = Post::factory()->create([
        'user_id' => $this->admin->id,
        'featured_image' => '/storage/canvas/images/hero.jpg',
    ]);

    $payload = WebhookPayload::forPost(
        WebhookEvent::PostPublished,
        $post->fresh(['tags', 'topic', 'user']),
        'delivery-abs',
    );

    expect($payload['data']['featured_image'])
        ->toBe('http://blog.test/storage/canvas/images/hero.jpg');
});
