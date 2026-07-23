<?php

declare(strict_types=1);

namespace Canvas\Enums;

enum Role: int
{
    case Contributor = 1;
    case Editor = 2;
    case Admin = 3;

    public function label(): string
    {
        return match ($this) {
            self::Contributor => 'Contributor',
            self::Editor => 'Editor',
            self::Admin => 'Admin',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function options(): array
    {
        return collect(self::cases())->mapWithKeys(
            static fn (self $role): array => [$role->value => $role->label()]
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
