<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Support\Facades\File;

final class Assets
{
    /**
     * @throws FileNotFoundException
     */
    public static function isUpToDate(): bool
    {
        if (app()->runningUnitTests()) {
            return true;
        }

        $hotFile = public_path('vendor/canvas/canvas.hot');

        if (File::exists($hotFile)) {
            return true;
        }

        $path = public_path('vendor/canvas/manifest.json');

        if (! File::exists($path)) {
            return false;
        }

        return File::get($path) === File::get(__DIR__.'/../../public/vendor/canvas/manifest.json');
    }
}
