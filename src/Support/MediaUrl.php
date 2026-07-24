<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Origin-safe media URL helpers for Canvas-owned public-disk assets.
 *
 * Local public-disk files are stored and exposed as root-relative `/storage/...`
 * paths so browser requests follow the current origin (Herd, Valet, etc.) instead
 * of baking APP_URL into content. Absolute expansion is reserved for egress
 * (SEO, webhooks). Remote disks and third-party URLs stay absolute.
 */
final class MediaUrl
{
    /**
     * Public URL for a path on the Canvas storage disk.
     *
     * Local public-disk style URLs become root-relative `/storage/...`.
     * Remote disks (S3, CDN) keep their absolute object URLs.
     */
    public static function forDiskPath(string $path, ?string $disk = null): string
    {
        $disk ??= (string) config('canvas.storage_disk');
        $url = Storage::disk($disk)->url($path);

        if (self::isPublicStorageReference($url)) {
            return self::rootRelativeStorageUrl($url);
        }

        return $url;
    }

    /**
     * Expand a stored media reference to an absolute URL for external consumers.
     *
     * Public-disk references use $root (or the current request / app URL).
     * Already-absolute remote URLs are returned unchanged.
     */
    public static function absolute(?string $urlOrPath, ?string $root = null): ?string
    {
        if (! filled($urlOrPath)) {
            return null;
        }

        $urlOrPath = trim($urlOrPath);

        if ($urlOrPath === '') {
            return null;
        }

        if (self::isPublicStorageReference($urlOrPath)) {
            $relative = self::rootRelativeStorageUrl($urlOrPath);
            $base = rtrim($root ?? self::defaultRoot(), '/');

            return $base.$relative;
        }

        if (filter_var($urlOrPath, FILTER_VALIDATE_URL) !== false) {
            return $urlOrPath;
        }

        if (str_starts_with($urlOrPath, '/')) {
            $base = rtrim($root ?? self::defaultRoot(), '/');

            return $base.$urlOrPath;
        }

        return null;
    }

    /**
     * Normalize a value for persistence (featured image, avatar, etc.).
     *
     * Public-storage references (any host, or root-relative) become root-relative.
     * External absolute URLs are left unchanged. Empty input becomes null.
     */
    public static function toStoredMediaReference(?string $urlOrPath): ?string
    {
        if (! filled($urlOrPath)) {
            return null;
        }

        $urlOrPath = trim($urlOrPath);

        if ($urlOrPath === '') {
            return null;
        }

        if (self::isPublicStorageReference($urlOrPath)) {
            return self::rootRelativeStorageUrl($urlOrPath);
        }

        if (filter_var($urlOrPath, FILTER_VALIDATE_URL) !== false) {
            return $urlOrPath;
        }

        return $urlOrPath;
    }

    /**
     * Whether the value refers to a Laravel public-disk style `/storage/...` asset.
     */
    public static function isPublicStorageReference(?string $urlOrPath): bool
    {
        if (! filled($urlOrPath)) {
            return false;
        }

        $path = self::pathComponent(trim($urlOrPath));

        return $path !== null && str_starts_with($path, '/storage/');
    }

    private static function rootRelativeStorageUrl(string $urlOrPath): string
    {
        $parts = self::parseReference($urlOrPath);

        if ($parts === null) {
            return $urlOrPath;
        }

        $path = $parts['path'];

        // Avoid accidental double prefixes if a caller already prefixed poorly.
        while (str_starts_with($path, '/storage/storage/')) {
            $path = '/storage/'.substr($path, strlen('/storage/storage/'));
        }

        return $path.$parts['query'].$parts['fragment'];
    }

    /**
     * @return array{path: string, query: string, fragment: string}|null
     */
    private static function parseReference(string $urlOrPath): ?array
    {
        $parsed = parse_url($urlOrPath);

        if ($parsed === false || ! isset($parsed['path']) || $parsed['path'] === '') {
            return null;
        }

        $path = $parsed['path'];

        // parse_url on root-relative paths works; ensure leading slash.
        if (! str_starts_with($path, '/')) {
            $path = '/'.$path;
        }

        $query = isset($parsed['query']) && $parsed['query'] !== ''
            ? '?'.$parsed['query']
            : '';
        $fragment = isset($parsed['fragment']) && $parsed['fragment'] !== ''
            ? '#'.$parsed['fragment']
            : '';

        return [
            'path' => $path,
            'query' => $query,
            'fragment' => $fragment,
        ];
    }

    private static function pathComponent(string $urlOrPath): ?string
    {
        $parts = self::parseReference($urlOrPath);

        return $parts['path'] ?? null;
    }

    private static function defaultRoot(): string
    {
        // HTTP lifecycle: use the current request origin so OG tags match the
        // host the visitor hit. Console / queue workers fall back to app.url
        // (Pest and Artisan both report runningInConsole()).
        if (! app()->runningInConsole()) {
            $host = request()->getSchemeAndHttpHost();

            if ($host !== '' && ! str_ends_with($host, '://')) {
                return $host;
            }
        }

        return rtrim((string) config('app.url'), '/');
    }
}
