<?php

declare(strict_types=1);

namespace Canvas\Enums;

enum SettingKey: string
{
    case UnsplashAccessKey = 'unsplash.access_key';

    public function isSecret(): bool
    {
        return match ($this) {
            self::UnsplashAccessKey => true,
        };
    }
}
