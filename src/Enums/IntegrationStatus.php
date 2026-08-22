<?php

declare(strict_types=1);

namespace Canvas\Enums;

enum IntegrationStatus: string
{
    case Off = 'off';
    case Enabled = 'enabled';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
