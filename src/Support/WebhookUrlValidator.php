<?php

declare(strict_types=1);

namespace Canvas\Support;

final class WebhookUrlValidator
{
    private const MAX_LENGTH = 2048;

    /**
     * IPv6 prefixes that must not be used as webhook targets.
     *
     * Includes transition mechanisms that embed IPv4 destinations (6to4, NAT64,
     * IPv4-compatible) and other non-global special-use ranges PHP's
     * FILTER_FLAG_NO_PRIV_RANGE / FILTER_FLAG_NO_RES_RANGE do not reliably reject.
     *
     * @var list<array{0: string, 1: int}>
     */
    private const BLOCKED_IPV6_PREFIXES = [
        ['2002::', 16], // 6to4 (RFC 3056) — embeds IPv4 in bits 16–47
        ['64:ff9b::', 96], // NAT64 well-known prefix (RFC 6052)
        ['64:ff9b:1::', 48], // NAT64 local-use prefix (RFC 8215)
        ['::', 96], // IPv4-compatible IPv6 (deprecated)
        ['2001::', 32], // Teredo (RFC 4380)
        ['100::', 64], // discard-only (RFC 6666)
        ['2001:db8::', 32], // documentation (RFC 3849)
        ['fec0::', 10], // site-local (deprecated, RFC 3879)
    ];

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

        return self::hostResolvesToPublicAddress(self::normalizeHost($host));
    }

    /**
     * parse_url() keeps square brackets around IPv6 literals.
     */
    private static function normalizeHost(string $host): string
    {
        if (str_starts_with($host, '[') && str_ends_with($host, ']')) {
            return substr($host, 1, -1);
        }

        return $host;
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
        $packed = inet_pton($ip);

        if ($packed === false) {
            return false;
        }

        if (strlen($packed) === 16) {
            // Unwrap IPv4-mapped IPv6 (::ffff:a.b.c.d) and re-check as IPv4.
            if (substr($packed, 0, 12) === str_repeat("\0", 10)."\xff\xff") {
                $mapped = inet_ntop(substr($packed, 12));

                return is_string($mapped) && self::ipIsPublic($mapped);
            }

            foreach (self::BLOCKED_IPV6_PREFIXES as [$prefix, $bits]) {
                if (self::ipv6MatchesPrefix($packed, $prefix, $bits)) {
                    return false;
                }
            }
        }

        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) !== false;
    }

    private static function ipv6MatchesPrefix(string $packed, string $prefix, int $bits): bool
    {
        $prefixPacked = inet_pton($prefix);

        if ($prefixPacked === false || strlen($prefixPacked) !== 16 || $bits < 1 || $bits > 128) {
            return false;
        }

        $fullBytes = intdiv($bits, 8);
        $remainingBits = $bits % 8;

        if ($fullBytes > 0 && substr($packed, 0, $fullBytes) !== substr($prefixPacked, 0, $fullBytes)) {
            return false;
        }

        if ($remainingBits === 0) {
            return true;
        }

        $mask = (0xFF << (8 - $remainingBits)) & 0xFF;

        return (ord($packed[$fullBytes]) & $mask) === (ord($prefixPacked[$fullBytes]) & $mask);
    }
}
