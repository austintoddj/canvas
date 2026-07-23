<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\WebhookEvent;
use Canvas\Events\PostDeleted;
use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;
use Canvas\Models\Post;
use LogicException;

/**
 * Maps lifecycle classification results to Laravel domain events.
 */
final class PostLifecycleEvents
{
    /**
     * @param  PostSnapshot|null  $before  Null when the post did not exist yet
     */
    public static function dispatch(?PostSnapshot $before, Post $post, bool $deleted = false): void
    {
        $after = $deleted ? null : PostSnapshot::from($post);

        foreach (PostLifecycle::classify($before, $after, $deleted) as $event) {
            event(self::toDomainEvent($event, $post));
        }
    }

    private static function toDomainEvent(WebhookEvent $event, Post $post): object
    {
        return match ($event) {
            WebhookEvent::PostPublished => new PostPublished($post),
            WebhookEvent::PostScheduled => new PostScheduled($post),
            WebhookEvent::PostUpdated => new PostUpdated($post),
            WebhookEvent::PostUnpublished => new PostUnpublished($post),
            WebhookEvent::PostDeleted => new PostDeleted($post),
            WebhookEvent::WebhookTest => throw new LogicException(
                'webhook.test is not a post lifecycle domain event.',
            ),
        };
    }
}
