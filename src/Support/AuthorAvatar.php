<?php

declare(strict_types=1);

namespace Canvas\Support;

final class AuthorAvatar
{
    public static function url(?string $avatar): ?string
    {
        if (! filled($avatar)) {
            return null;
        }

        if (filter_var($avatar, FILTER_VALIDATE_URL) === false) {
            return null;
        }

        return $avatar;
    }
}
