<?php

declare(strict_types=1);

namespace Canvas\Support;

final class AuthorAvatar
{
    public static function url(?string $avatar, string $email, int $size = 200): string
    {
        if (! filled($avatar)) {
            return Gravatar::url($email, $size);
        }

        if (filter_var($avatar, FILTER_VALIDATE_URL)) {
            return $avatar;
        }

        return "https://secure.gravatar.com/avatar/{$avatar}?s={$size}&d=retro&r=g";
    }
}
