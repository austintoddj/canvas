<?php

declare(strict_types=1);

namespace Canvas\Support;

final class SocialProfiles
{
    /**
     * @var list<string>
     */
    public const PLATFORMS = [
        'facebook',
        'instagram',
        'bluesky',
        'x',
        'github',
        'medium',
    ];

    /**
     * Public profile URL prefix per platform (handle is appended).
     *
     * @var array<string, string>
     */
    public const BASES = [
        'facebook' => 'https://facebook.com/',
        'instagram' => 'https://instagram.com/',
        'bluesky' => 'https://bsky.app/profile/',
        'x' => 'https://x.com/',
        'github' => 'https://github.com/',
        'medium' => 'https://medium.com/@',
    ];

    /**
     * @var array<string, list<string>>
     */
    private const HOST_ALIASES = [
        'facebook' => ['facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com', 'm.facebook.com'],
        'instagram' => ['instagram.com', 'www.instagram.com'],
        'bluesky' => ['bsky.app', 'www.bsky.app'],
        'x' => ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'],
        'github' => ['github.com', 'www.github.com'],
        'medium' => ['medium.com', 'www.medium.com'],
    ];

    public static function normalizeHandle(string $platform, string $raw): string
    {
        $value = trim($raw);

        if ($value === '') {
            return '';
        }

        if (! preg_match('#^https?://#i', $value) && str_contains($value, '.') && str_contains($value, '/')) {
            $value = 'https://'.ltrim($value, '/');
        }

        if (preg_match('#^https?://#i', $value) === 1) {
            $host = strtolower((string) parse_url($value, PHP_URL_HOST));
            $aliases = self::HOST_ALIASES[$platform] ?? [];

            if ($host !== '' && in_array($host, $aliases, true)) {
                $path = (string) (parse_url($value, PHP_URL_PATH) ?? '');
                $segments = array_values(array_filter(
                    array_map(static fn (string $segment): string => trim($segment), explode('/', $path)),
                    static fn (string $segment): bool => $segment !== '',
                ));

                if ($platform === 'bluesky' && ($segments[0] ?? null) !== null && strtolower($segments[0]) === 'profile') {
                    array_shift($segments);
                }

                if ($platform === 'medium' && ($segments[0] ?? null) !== null && str_starts_with($segments[0], '@')) {
                    $segments[0] = substr($segments[0], 1);
                }

                if (($segments[0] ?? null) !== null && $segments[0] !== '') {
                    $value = $segments[0];
                }
            }
        }

        $value = ltrim($value, '@');
        $value = trim($value, " \t\n\r\0\x0B/");

        if ($platform === 'medium') {
            $value = ltrim($value, '@');
        }

        return $value;
    }

    public static function profileUrl(string $platform, string $handle): ?string
    {
        $normalized = self::normalizeHandle($platform, $handle);

        if ($normalized === '' || ! isset(self::BASES[$platform])) {
            return null;
        }

        return self::BASES[$platform].$normalized;
    }

    /**
     * @param  array<array-key, mixed>  $social
     * @return array<string, string>|null
     */
    public static function normalizeMap(array $social): ?array
    {
        $links = [];

        foreach ($social as $platform => $value) {
            if (! is_string($value)) {
                continue;
            }

            $key = (string) $platform;

            if (! in_array($key, self::PLATFORMS, true)) {
                continue;
            }

            $handle = self::normalizeHandle($key, $value);

            if ($handle !== '') {
                $links[$key] = $handle;
            }
        }

        return $links === [] ? null : $links;
    }
}
