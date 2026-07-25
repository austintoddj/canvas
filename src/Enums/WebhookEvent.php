<?php

declare(strict_types=1);

namespace Canvas\Enums;

use Canvas\Events\PostDeleted;
use Canvas\Events\PostPublished;
use Canvas\Events\PostScheduled;
use Canvas\Events\PostUnpublished;
use Canvas\Events\PostUpdated;
use Canvas\Support\Localization;

enum WebhookEvent: string
{
    case PostPublished = 'post.published';
    case PostScheduled = 'post.scheduled';
    case PostUpdated = 'post.updated';
    case PostUnpublished = 'post.unpublished';
    case PostDeleted = 'post.deleted';
    case WebhookTest = 'webhook.test';

    public function label(?string $locale = null): string
    {
        return $this->translate($this->labelKey(), $locale);
    }

    /**
     * Short admin-facing explanation for subscribable events.
     */
    public function description(?string $locale = null): ?string
    {
        $key = $this->descriptionKey();

        if ($key === null) {
            return null;
        }

        return $this->translate($key, $locale);
    }

    private function labelKey(): string
    {
        return match ($this) {
            self::PostPublished => 'integrations.webhooks_event_published',
            self::PostScheduled => 'integrations.webhooks_event_scheduled',
            self::PostUpdated => 'integrations.webhooks_event_updated',
            self::PostUnpublished => 'integrations.webhooks_event_unpublished',
            self::PostDeleted => 'integrations.webhooks_event_deleted',
            self::WebhookTest => 'integrations.webhooks_event_test',
        };
    }

    private function descriptionKey(): ?string
    {
        return match ($this) {
            self::PostPublished => 'integrations.webhooks_event_published_help',
            self::PostScheduled => 'integrations.webhooks_event_scheduled_help',
            self::PostUpdated => 'integrations.webhooks_event_updated_help',
            self::PostUnpublished => 'integrations.webhooks_event_unpublished_help',
            self::PostDeleted => 'integrations.webhooks_event_deleted_help',
            self::WebhookTest => null,
        };
    }

    private function translate(string $key, ?string $locale): string
    {
        $translationLocale = $locale === null
            ? null
            : Localization::resolveTranslationLocale($locale);

        return (string) trans('canvas::app.'.$key, [], $translationLocale);
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
     * Labels and descriptions are localized for display only — ids remain stable machine values.
     *
     * @return list<array{id: string, label: string, description: string}>
     */
    public static function subscribableOptions(?string $locale = null): array
    {
        return array_map(
            static function (self $event) use ($locale): array {
                $description = $event->description($locale);

                return [
                    'id' => $event->value,
                    'label' => $event->label($locale),
                    'description' => $description ?? '',
                ];
            },
            self::subscribable(),
        );
    }
}
