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

        $value = trim($value);
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

    /**
     * ISO-8601 created_at for a settings row without decrypting the value.
     */
    public function createdAt(SettingKey $key): ?string
    {
        $row = Setting::query()->find($key->value);

        return $row?->created_at?->toIso8601String();
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

        return str_repeat('•', 8).substr($value, -4);
    }
}
