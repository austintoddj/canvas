<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\AiProvider;
use Canvas\Enums\SettingKey;

final class Ai
{
    public static function configured(): bool
    {
        return self::provider() !== null && filled(self::apiKey());
    }

    public static function provider(): ?AiProvider
    {
        $value = app(SettingsRepository::class)->get(SettingKey::AiProvider);

        if ($value === null || $value === '') {
            return null;
        }

        return AiProvider::tryFrom($value);
    }

    public static function apiKey(): ?string
    {
        return app(SettingsRepository::class)->get(SettingKey::AiApiKey);
    }

    public static function model(): ?string
    {
        $provider = self::provider();

        if ($provider === null) {
            return null;
        }

        $override = app(SettingsRepository::class)->get(SettingKey::AiModel);

        if (filled($override)) {
            return $override;
        }

        return $provider->defaultModel();
    }

    public static function modelOverride(): ?string
    {
        $override = app(SettingsRepository::class)->get(SettingKey::AiModel);

        return filled($override) ? $override : null;
    }
}
