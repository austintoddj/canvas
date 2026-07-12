<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\SettingKey;
use Canvas\Models\Setting;
use Illuminate\Support\Facades\Crypt;
use Throwable;

final class SettingsRepository
{
    public function get(SettingKey $key): ?string
    {
        $row = Setting::query()->find($key->value);

        if ($row === null || $row->value === null || $row->value === '') {
            return null;
        }

        if (! $key->isSecret()) {
            return $row->value;
        }

        try {
            return Crypt::decryptString($row->value);
        } catch (Throwable) {
            return null;
        }
    }

    public function set(SettingKey $key, ?string $value): void
    {
        if ($value === null || trim($value) === '') {
            $this->forget($key);

            return;
        }

        $stored = $key->isSecret() ? Crypt::encryptString($value) : $value;

        Setting::query()->updateOrCreate(
            ['key' => $key->value],
            ['value' => $stored],
        );
    }

    public function forget(SettingKey $key): void
    {
        Setting::query()->where('key', $key->value)->delete();
    }

    public function has(SettingKey $key): bool
    {
        return filled($this->get($key));
    }

    public static function mask(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $length = strlen($value);

        if ($length <= 4) {
            return str_repeat('•', $length);
        }

        return str_repeat('•', max(4, $length - 4)).substr($value, -4);
    }
}
