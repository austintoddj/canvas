<?php

declare(strict_types=1);

namespace Canvas\Enums;

use Canvas\Events\PostDeleted;
use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;

enum WebhookEvent: string
{
    case PostPublished = 'post.published';
    case PostScheduled = 'post.scheduled';
    case PostUpdated = 'post.updated';
    case PostUnpublished = 'post.unpublished';
    case PostDeleted = 'post.deleted';
    case WebhookTest = 'webhook.test';

    public function label(): string
    {
        return match ($this) {
            self::PostPublished => 'Published',
            self::PostScheduled => 'Scheduled',
            self::PostUpdated => 'Updated',
            self::PostUnpublished => 'Unpublished',
            self::PostDeleted => 'Deleted',
            self::WebhookTest => 'Test',
        };
    }

    public static function fromDomainEvent(object $event): ?self
    {
        return match (true) {
            $event instanceof PostPublished => self::PostPublished,
            $event instanceof PostScheduled => self::PostScheduled,
            $event instanceof PostUpdated => self::PostUpdated,
            $event instanceof PostUnpublished => self::PostUnpublished,
            $event instanceof PostDeleted => self::PostDeleted,
            default => null,
        };
    }

    /**
     * Events admins may subscribe to for outbound delivery.
     */
    public function isSubscribable(): bool
    {
        return $this !== self::WebhookTest;
    }

    /**
     * @return list<self>
     */
    public static function subscribable(): array
    {
        return array_values(array_filter(
            self::cases(),
            static fn (self $event): bool => $event->isSubscribable(),
        ));
    }

    /**
     * @return list<string>
     */
    public static function subscribableValues(): array
    {
        return array_map(
            static fn (self $event): string => $event->value,
            self::subscribable(),
        );
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Catalog for admin UI / status payloads.
     *
     * @return list<array{id: string, label: string}>
     */
    public static function subscribableOptions(): array
    {
        return array_map(
            static fn (self $event): array => [
                'id' => $event->value,
                'label' => $event->label(),
            ],
            self::subscribable(),
        );
    }
}
