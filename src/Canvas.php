<?php

namespace Canvas;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;

class Canvas
{
    /**
     * Build a global JavaScript object for the Vue app.
     *
     * @return array
     */
    public static function scriptVariables()
    {
        $metaData = UserMeta::forCurrentUser()->first();
        $emailHash = md5(trim(Str::lower(request()->user()->email)));

        return [
            'avatar' => optional($metaData)->avatar && ! empty(optional($metaData)->avatar) ? $metaData->avatar : "https://secure.gravatar.com/avatar/{$emailHash}?s=500",
            'darkMode' => optional($metaData)->dark_mode,
            'lang' => collect(['app' => trans('canvas::app')])->toJson(),
            'locale' => config('app.locale'),
            'maxUpload' => config('canvas.upload_filesize'),
            'path' => config('canvas.path'),
            'timezone' => config('app.timezone'),
            'unsplash' => config('canvas.unsplash.access_key'),
            'user' => auth()->user()->only(['name', 'email']),
        ];
    }

    /**
     * Check that the public assets are published and up-to-date.
     *
     * @return bool
     */
    public static function assetsUpToDate(): bool
    {
        $path = public_path('vendor/canvas/mix-manifest.json');

        if (! File::exists($path)) {
            throw new RuntimeException(__('canvas::app.assets_are_not_up_to_date').__('canvas::app.to_update_run').' php artisan canvas:publish');
        }

        return File::get($path) === File::get(__DIR__.'/../public/mix-manifest.json');
    }
}
