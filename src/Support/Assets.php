<?php

declare(strict_types=1);

namespace Canvas\Support;

use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Support\Facades\File;
use RuntimeException;

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

        $path = public_path('vendor/canvas/.vite/manifest.json');

        $message = sprintf(
            '%s%s.  %s',
            trans('canvas::app.assets_are_not_up_to_date'),
            trans('canvas::app.to_update_run'),
            'php artisan canvas:publish'
        );

        if (! File::exists($path)) {
            throw new RuntimeException($message);
        }

        return File::get($path) === File::get(__DIR__.'/../../public/build/.vite/manifest.json');
    }
}
