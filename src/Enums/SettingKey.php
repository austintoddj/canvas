<?php

declare(strict_types=1);

namespace Canvas\Enums;

enum SettingKey: string
{
    case UnsplashAccessKey = 'unsplash.access_key';
    case AiProvider = 'ai.provider';
    case AiApiKey = 'ai.api_key';
    case AiModel = 'ai.model';

    public function isSecret(): bool
    {
        return match ($this) {
            self::UnsplashAccessKey, self::AiApiKey => true,
            self::AiProvider, self::AiModel => false,
        };
    }
}
