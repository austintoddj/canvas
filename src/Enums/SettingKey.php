<?php

declare(strict_types=1);

namespace Canvas\Enums;

enum SettingKey: string
{
    case UnsplashAccessKey = 'unsplash.access_key';
    case AiProvider = 'ai.provider';
    case AiApiKey = 'ai.api_key';
    case AiModel = 'ai.model';
    case WebhookUrl = 'webhooks.url';
    case WebhookSecret = 'webhooks.secret';
    case WebhookEvents = 'webhooks.events';

    public function isSecret(): bool
    {
        return match ($this) {
            self::UnsplashAccessKey, self::AiApiKey, self::WebhookSecret => true,
            self::AiProvider, self::AiModel, self::WebhookUrl, self::WebhookEvents => false,
        };
    }
}
