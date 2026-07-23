<?php

declare(strict_types=1);

namespace Canvas\Support;

final class WebhookUrlValidator
{
    private const MAX_LENGTH = 2048;

    public static function isAllowed(string $url): bool
    {
        $url = trim($url);

        if ($url === '' || strlen($url) > self::MAX_LENGTH) {
            return false;
        }

        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        $parts = parse_url($url);

        if ($parts === false) {
            return false;
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = $parts['host'] ?? null;

        if ($scheme !== 'https' || ! is_string($host) || $host === '') {
            return false;
        }

        if (isset($parts['user']) || isset($parts['pass'])) {
            return false;
        }

        return self::hostResolvesToPublicAddress($host);
    }

    private static function hostResolvesToPublicAddress(string $host): bool
    {
        if (filter_var($host, FILTER_VALIDATE_IP) !== false) {
            return self::ipIsPublic($host);
        }

        $ips = gethostbynamel($host);

        if ($ips === false || $ips === []) {
            return false;
        }

        foreach ($ips as $ip) {
            if (! self::ipIsPublic($ip)) {
                return false;
            }
        }

        return true;
    }

    private static function ipIsPublic(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) !== false;
    }
}
