<?php

declare(strict_types=1);

namespace Canvas\Support;

final class Referer
{
    public static function host(?string $url): ?string
    {
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            return parse_url($url, PHP_URL_HOST);
        }

        return null;
    }
}
