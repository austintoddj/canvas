<?php

declare(strict_types=1);

namespace Canvas\Enums;

enum MediaType: string
{
    case Image = 'image';

    public static function fromMimeType(?string $mimeType): ?self
    {
        if ($mimeType === null || $mimeType === '') {
            return null;
        }

        return match (true) {
            str_starts_with($mimeType, 'image/') => self::Image,
            default => null,
        };
    }
}
