<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\IntegrationStatus;
use Canvas\Enums\SettingKey;
use Canvas\Enums\WebhookEvent;

final class Webhooks
{
    /**
     * Lifecycle events fire only when status is explicitly enabled.
     */
    public static function configured(): bool
    {
        return self::status() === IntegrationStatus::Enabled;
    }

    /**
     * URL, secret, and events are stored, but a signed test has not succeeded.
     * Incomplete setup is still Off — not a third durable connection status.
     */
    public static function pending(): bool
    {
        return self::hasCredentials() && self::status() !== IntegrationStatus::Enabled;
    }

    public static function hasCredentials(): bool
    {
        return filled(self::url())
            && filled(self::secret())
            && self::events() !== [];
    }

    /**
     * Enabled only after a successful webhook.test. Credentials without that
     * handshake — including a leftover `pending` row from earlier builds — are off.
     */
    public static function status(): IntegrationStatus
    {
        if (! self::hasCredentials()) {
            return IntegrationStatus::Off;
        }

        return app(SettingsRepository::class)->get(SettingKey::WebhookStatus) === IntegrationStatus::Enabled->value
            ? IntegrationStatus::Enabled
            : IntegrationStatus::Off;
    }

    public static function verifiedAt(): ?string
    {
        $value = app(SettingsRepository::class)->get(SettingKey::WebhookVerifiedAt);

        return filled($value) ? $value : null;
    }

    public static function url(): ?string
    {
        $url = app(SettingsRepository::class)->get(SettingKey::WebhookUrl);

        return filled($url) ? trim($url) : null;
    }

    public static function secret(): ?string
    {
        $secret = app(SettingsRepository::class)->get(SettingKey::WebhookSecret);

        return filled($secret) ? $secret : null;
    }

    /**
     * Subscribed lifecycle events (never includes webhook.test).
     *
     * @return list<WebhookEvent>
     */
    public static function events(): array
    {
        $raw = app(SettingsRepository::class)->get(SettingKey::WebhookEvents);

        if ($raw === null || $raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return [];
        }

        $events = [];

        foreach ($decoded as $value) {
            if (! is_string($value)) {
                continue;
            }

            $event = WebhookEvent::tryFrom($value);

            if ($event !== null && $event->isSubscribable()) {
                $events[$event->value] = $event;
            }
        }

        return array_values($events);
    }

    /**
     * @return list<string>
     */
    public static function eventValues(): array
    {
        return array_map(
            static fn (WebhookEvent $event): string => $event->value,
            self::events(),
        );
    }

    public static function subscribesTo(WebhookEvent $event): bool
    {
        if (! $event->isSubscribable()) {
            return false;
        }

        foreach (self::events() as $subscribed) {
            if ($subscribed === $event) {
                return true;
            }
        }

        return false;
    }
}
