<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Foundation\Vite as BaseVite;
use Illuminate\Foundation\ViteException;
use Illuminate\Support\HtmlString;

final class Vite
{
    public static function instance(): BaseVite
    {
        return (new BaseVite)
            ->useHotFile(public_path('vendor/canvas/canvas.hot'))
            ->useBuildDirectory('vendor/canvas');
    }

    public static function tags(): HtmlString
    {
        return self::safe(
            static fn (): HtmlString => self::instance()(['resources/js/app.tsx']),
            new HtmlString(''),
        );
    }

    public static function reactRefresh(): HtmlString|string
    {
        return self::safe(
            static fn (): HtmlString|string => self::instance()->reactRefresh() ?? '',
            '',
        );
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @param  T  $default
     * @return T
     */
    private static function safe(callable $callback, mixed $default): mixed
    {
        try {
            return $callback();
        } catch (ViteException) {
            return $default;
        }
    }
}
