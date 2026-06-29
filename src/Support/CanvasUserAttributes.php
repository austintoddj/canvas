<?php

declare(strict_types=1);

namespace Canvas\Support;

final class CanvasUserAttributes
{
    /**
     * @var list<string>
     */
    public const PROFILE = [
        'username',
        'summary',
        'avatar',
        'website',
        'social',
    ];

    /**
     * @var list<string>
     */
    public const LOCALIZATION = [
        'locale',
        'timezone',
    ];

    /**
     * @var list<string>
     */
    public const UI = [
        'dark_mode',
    ];

    /**
     * @var list<string>
     */
    public const NOTIFICATIONS = [
        'digest',
    ];

    /**
     * @var list<string>
     */
    public const ACCESS = [
        'role',
    ];

    /**
     * @var list<string>
     */
    public const JSON = [
        'preferences',
    ];

    /**
     * @return list<string>
     */
    public static function columns(): array
    {
        return [
            ...self::PROFILE,
            ...self::LOCALIZATION,
            ...self::UI,
            ...self::NOTIFICATIONS,
        ];
    }

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return [
            ...self::columns(),
            ...self::JSON,
            ...self::ACCESS,
        ];
    }
}
