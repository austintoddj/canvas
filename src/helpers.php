<?php

use Illuminate\Support\Facades\File;

if (! function_exists('is_fresh')) {
    /**
     * Return true if the given ID is for a new resource.
     *
     * @param string $id
     * @return bool
     */
    function is_fresh(string $id): bool
    {
        return $id === 'create';
    }
}

if (! function_exists('assets_up_to_date')) {
    /**
     * Return true if the public assets are up to date.
     *
     * @return bool
     */
    function assets_up_to_date(): bool
    {
        $path = public_path('vendor/canvas/mix-manifest.json');

        if (! File::exists($path)) {
            throw new RuntimeException(__('canvas::app.assets_are_not_up_to_date').__('canvas::app.to_update_run').' php artisan canvas:publish');
        }

        return File::get($path) === File::get(__DIR__.'/../public/mix-manifest.json');
    }
}
