<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\WebhookEvent;

/**
 * Pure classifier: public snapshot before/after → outbound lifecycle events.
 *
 * Controllers (or future pollers) capture snapshots; this class has no I/O.
 */
final class PostLifecycle
{
    /**
     * @return list<WebhookEvent>
     */
    public static function classify(?PostSnapshot $before, ?PostSnapshot $after, bool $deleted = false): array
    {
        if ($deleted) {
            return [WebhookEvent::PostDeleted];
        }

        if ($after === null) {
            return [];
        }

        $from = $before?->visibility() ?? 'draft';
        $to = $after->visibility();

        if ($from === $to) {
            return self::sameVisibilityEvents($from, $before, $after);
        }

        return match (true) {
            $from === 'draft' && $to === 'live' => [WebhookEvent::PostPublished],
            $from === 'draft' && $to === 'scheduled' => [WebhookEvent::PostScheduled],
            $from === 'scheduled' && $to === 'live' => [WebhookEvent::PostPublished],
            $from === 'scheduled' && $to === 'draft' => [WebhookEvent::PostUnpublished],
            $from === 'live' && $to === 'draft' => [WebhookEvent::PostUnpublished],
            $from === 'live' && $to === 'scheduled' => [
                WebhookEvent::PostUnpublished,
                WebhookEvent::PostScheduled,
            ],
            default => [],
        };
    }

    /**
     * @return list<WebhookEvent>
     */
    private static function sameVisibilityEvents(string $visibility, ?PostSnapshot $before, PostSnapshot $after): array
    {
        if ($visibility === 'draft' || $before === null) {
            return [];
        }

        if ($before->fingerprintEquals($after)) {
            return [];
        }

        return [WebhookEvent::PostUpdated];
    }
}
