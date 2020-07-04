<?php

namespace Canvas\Helpers;

use Illuminate\Support\Facades\File;
use RuntimeException;

class Asset
{
    /**
     * Return true if the publishable assets are up to date.
     *
     * @return bool
     */
    public static function upToDate(): bool
    {
        $path = public_path('vendor/canvas/mix-manifest.json');
        $message = sprintf('%s%s.  %s',
            __('canvas::app.assets_are_not_up_to_date'),
            __('canvas::app.to_update_run'),
            'php artisan canvas:publish'
        );

        if (! File::exists($path)) {
            throw new RuntimeException($message);
        }

        return File::get($path) === File::get(__DIR__.'/../../public/mix-manifest.json');
    }
}
