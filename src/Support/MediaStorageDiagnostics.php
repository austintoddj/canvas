<?php

declare(strict_types=1);

namespace Canvas\Support;

/**
 * Detects host filesystem configuration that will break media URLs in the admin UI.
 *
 * Canvas needs a publicly reachable disk (typically "public" + storage:link). Laravel 11+
 * "local" disks are private and only serve files via signed routes, which <img> tags do not use.
 */
final class MediaStorageDiagnostics
{
    /**
     * @return list<string>
     */
    public static function warnings(): array
    {
        $disk = (string) config('canvas.storage_disk', 'public');
        $config = config("filesystems.disks.{$disk}");

        if (! is_array($config)) {
            return [
                "Canvas storage disk [{$disk}] is not defined in config/filesystems.php. Set CANVAS_STORAGE_DISK to a valid disk (recommended: public).",
            ];
        }

        $warnings = [];

        if (self::diskIsPrivateLocal($config)) {
            $warnings[] = "Canvas storage disk [{$disk}] is a private local disk. Media uploads will save, but image URLs will return 403 in the browser. Set CANVAS_STORAGE_DISK=public (and CANVAS_STORAGE_PATH=canvas) in your .env, then run: php artisan storage:link";
        }

        if (self::diskExpectsStorageLink($disk, $config) && ! self::storageLinkExists()) {
            $warnings[] = 'The public/storage symlink is missing, so media URLs under /storage will not resolve. Run: php artisan storage:link';
        }

        return $warnings;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    public static function diskIsPrivateLocal(array $config): bool
    {
        if (($config['driver'] ?? null) !== 'local') {
            return false;
        }

        if (($config['visibility'] ?? null) === 'public') {
            return false;
        }

        // Public-style disks always define a base URL for browser access.
        if (! empty($config['url'])) {
            return false;
        }

        return true;
    }

    /**
     * @param  array<string, mixed>  $config
     */
    public static function diskExpectsStorageLink(string $disk, array $config): bool
    {
        if ($disk === 'public') {
            return true;
        }

        $url = $config['url'] ?? null;

        if (! is_string($url) || $url === '') {
            return false;
        }

        $path = parse_url($url, PHP_URL_PATH);

        return is_string($path) && str_contains($path, '/storage');
    }

    public static function storageLinkExists(): bool
    {
        $link = public_path('storage');

        return is_link($link) || is_dir($link);
    }
}
