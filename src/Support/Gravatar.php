<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Support\Str;

final class Gravatar
{
    public static function url(
        string $email,
        int $size = 200,
        string $default = 'retro',
        string $rating = 'g'
    ): string {
        $hash = md5(trim(Str::lower($email)));

        return "https://secure.gravatar.com/avatar/{$hash}?s={$size}&d={$default}&r={$rating}";
    }
}
