<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\SettingKey;

final class Unsplash
{
    public static function accessKey(): ?string
    {
        return app(SettingsRepository::class)->get(SettingKey::UnsplashAccessKey);
    }

    public static function configured(): bool
    {
        return filled(self::accessKey());
    }
}
