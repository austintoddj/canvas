<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Http\Request;

/**
 * Effective media upload size limits.
 *
 * Config `canvas.upload_filesize` is the desired max. The value exposed to the
 * SPA and validation is clamped to PHP's post_max_size / upload_max_filesize so
 * the UI never allows files the server will reject with HTTP 413.
 */
final class UploadLimits
{
    /**
     * Bytes reserved for multipart boundaries and non-file form fields so
     * Content-Length stays under post_max_size when the file is at the limit.
     */
    public const MULTIPART_HEADROOM_BYTES = 65_536;

    public static function maxBytes(): int
    {
        $configured = max(0, (int) config('canvas.upload_filesize'));

        return min($configured, self::phpMaxFileBytes());
    }

    public static function maxKilobytes(): int
    {
        return max(1, (int) floor(self::maxBytes() / 1024));
    }

    public static function tooLargeMessage(?int $maxBytes = null, ?string $locale = null): string
    {
        $bytes = $maxBytes ?? self::maxBytes();
        $translationLocale = Localization::resolveTranslationLocale($locale);

        return (string) trans('canvas::app.media.too_large', [
            'max' => self::formatBytes($bytes),
        ], $translationLocale);
    }

    public static function tooLargeMessageGeneric(?string $locale = null): string
    {
        $translationLocale = Localization::resolveTranslationLocale($locale);

        return (string) trans('canvas::app.media.too_large_generic', [], $translationLocale);
    }

    /**
     * Best-effort user locale for API responses (may be null before auth runs).
     */
    public static function requestLocale(?Request $request = null): ?string
    {
        $request ??= request();
        $locale = data_get($request->user(config('canvas.guard')), 'locale');

        return is_string($locale) && $locale !== '' ? $locale : null;
    }

    public static function phpMaxFileBytes(): int
    {
        return self::effectivePhpMaxFileBytes(
            self::iniBytes((string) ini_get('post_max_size')),
            self::iniBytes((string) ini_get('upload_max_filesize')),
        );
    }

    /**
     * @param  int  $postMaxBytes  Parsed post_max_size; PHP_INT_MAX means unlimited.
     * @param  int  $uploadMaxBytes  Parsed upload_max_filesize; PHP_INT_MAX means unlimited.
     */
    public static function effectivePhpMaxFileBytes(int $postMaxBytes, int $uploadMaxBytes): int
    {
        $candidates = [];

        if ($postMaxBytes < PHP_INT_MAX) {
            $candidates[] = max(0, $postMaxBytes - self::MULTIPART_HEADROOM_BYTES);
        }

        if ($uploadMaxBytes < PHP_INT_MAX) {
            $candidates[] = max(0, $uploadMaxBytes);
        }

        if ($candidates === []) {
            return PHP_INT_MAX;
        }

        return min($candidates);
    }

    /**
     * Parse a PHP ini size string (e.g. "2M", "512K") into bytes.
     * Empty, "0", or invalid values are treated as unlimited.
     */
    public static function iniBytes(string $value): int
    {
        $value = trim($value);

        if ($value === '' || $value === '0') {
            return PHP_INT_MAX;
        }

        if (! preg_match('/^(?<number>\d+)(?<unit>[KMG])?$/i', $value, $matches)) {
            return PHP_INT_MAX;
        }

        $number = (int) $matches['number'];

        if ($number === 0) {
            return PHP_INT_MAX;
        }

        $unit = strtoupper($matches['unit'] ?? '');

        return match ($unit) {
            'G' => $number * 1024 * 1024 * 1024,
            'M' => $number * 1024 * 1024,
            'K' => $number * 1024,
            default => $number,
        };
    }

    public static function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }

        if ($bytes < 1024 * 1024) {
            return (string) (int) round($bytes / 1024).' KB';
        }

        $mb = $bytes / (1024 * 1024);

        return sprintf('%s MB', rtrim(rtrim(number_format($mb, 1, '.', ''), '0'), '.'));
    }

    public static function isCanvasApiRequest(Request $request): bool
    {
        $base = trim(Paths::basePath(), '/');
        $prefix = $base === '' ? 'api' : $base.'/api';

        return $request->is($prefix, $prefix.'/*');
    }
}
