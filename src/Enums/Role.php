<?php

declare(strict_types=1);

namespace Canvas\Enums;

use Canvas\Support\Localization;

enum Role: int
{
    case Contributor = 1;
    case Editor = 2;
    case Admin = 3;

    public function label(?string $locale = null): string
    {
        $key = match ($this) {
            self::Contributor => 'users.role_contributor',
            self::Editor => 'users.role_editor',
            self::Admin => 'users.role_admin',
        };

        $translationLocale = $locale === null
            ? null
            : Localization::resolveTranslationLocale($locale);

        return (string) trans('canvas::app.'.$key, [], $translationLocale);
    }

    /**
     * @return array<int, string>
     */
    public static function options(?string $locale = null): array
    {
        return collect(self::cases())->mapWithKeys(
            static fn (self $role): array => [$role->value => $role->label($locale)]
        )->all();
    }

    /**
     * @return list<int>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return list<string>
     */
    public static function names(): array
    {
        return array_map(
            static fn (self $role): string => $role->name,
            self::cases(),
        );
    }
}
