<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\WebhookEvent;
use Canvas\Models\Post;
use DateTimeInterface;

final class WebhookPayload
{
    public const API_VERSION = 1;

    /**
     * @return array{
     *     api_version: int,
     *     event: string,
     *     delivery_id: string,
     *     created_at: string,
     *     data: array<string, mixed>
     * }
     */
    public static function forPost(
        WebhookEvent $event,
        Post $post,
        string $deliveryId,
        ?DateTimeInterface $createdAt = null,
    ): array {
        $post->loadMissing(['tags:name,slug', 'topic:id,name,slug', 'user']);

        $author = PostAuthor::for($post);
        $topic = $post->topic;

        /** @var array<string, mixed>|null $meta */
        $meta = is_array($post->meta) ? $post->meta : null;

        return [
            'api_version' => self::API_VERSION,
            'event' => $event->value,
            'delivery_id' => $deliveryId,
            'created_at' => self::iso8601($createdAt ?? now()),
            'data' => [
                'id' => $post->id,
                'slug' => $post->slug,
                'title' => $post->title,
                'summary' => $post->summary,
                'published_at' => $post->published_at !== null
                    ? self::iso8601($post->published_at)
                    : null,
                'featured_image' => MediaUrl::absolute(
                    is_string($post->featured_image) ? $post->featured_image : null,
                ),
                'featured_image_caption' => $post->featured_image_caption,
                'meta' => $meta,
                'topic' => $topic !== null
                    ? [
                        'name' => $topic->name,
                        'slug' => $topic->slug,
                    ]
                    : null,
                'tags' => $post->tags
                    ->map(static fn ($tag): array => [
                        'name' => $tag->name,
                        'slug' => $tag->slug,
                    ])
                    ->values()
                    ->all(),
                'author' => $author === null
                    ? null
                    : [
                        'id' => $author['id'],
                        'name' => $author['name'],
                        'username' => $author['username'],
                    ],
                'created_at' => $post->created_at !== null ? self::iso8601($post->created_at) : null,
                'updated_at' => $post->updated_at !== null ? self::iso8601($post->updated_at) : null,
            ],
        ];
    }

    /**
     * @return array{
     *     api_version: int,
     *     event: string,
     *     delivery_id: string,
     *     created_at: string,
     *     data: array{ok: bool, message: string}
     * }
     */
    public static function test(string $deliveryId, ?DateTimeInterface $createdAt = null): array
    {
        return [
            'api_version' => self::API_VERSION,
            'event' => WebhookEvent::WebhookTest->value,
            'delivery_id' => $deliveryId,
            'created_at' => self::iso8601($createdAt ?? now()),
            'data' => [
                'ok' => true,
                'message' => 'Canvas webhook test',
            ],
        ];
    }

    private static function iso8601(DateTimeInterface $value): string
    {
        return $value->format(DateTimeInterface::ATOM);
    }
}
