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
        try {
            return self::instance()(['resources/js/app.tsx']);
        } catch (ViteException) {
            return new HtmlString('');
        }
    }

    public static function reactRefresh(): HtmlString|string
    {
        try {
            return self::instance()->reactRefresh() ?? '';
        } catch (ViteException) {
            return '';
        }
    }
}
