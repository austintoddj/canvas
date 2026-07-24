<?php

declare(strict_types=1);

namespace Canvas\Data;

/**
 * Open-ended JSON preferences bag for canvas users.
 *
 * Defaults stay empty until a concrete preference key is introduced.
 * Merge/resolve keep partial updates additive so future keys can be layered
 * without replacing the whole blob.
 */
final class UserPreferences
{
    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [];
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
