<?php

declare(strict_types=1);

namespace Canvas\Data;

use Canvas\Enums\UserPreference;

final class UserPreferences
{
    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            UserPreference::Onboarding->value => [
                'complete' => false,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>|null  $stored
     * @return array<string, mixed>
     */
    public static function resolve(?array $stored): array
    {
        return self::merge($stored, []);
    }

    /**
     * @param  array<string, mixed>|null  $stored
     * @param  array<string, mixed>  $incoming
     * @return array<string, mixed>
     */
    public static function merge(?array $stored, array $incoming): array
    {
        return array_replace_recursive(
            self::defaults(),
            $stored ?? [],
            $incoming,
        );
    }
}
