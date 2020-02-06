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
            'lang'      => self::compileLanguageFile(config('app.locale')),
            'path'      => config('canvas.path'),
            'timezone'  => config('app.timezone'),
            'unsplash'  => config('canvas.unsplash.access_key'),
            'user'      => auth()->user()->only(['name', 'email']),
            'avatar'    => optional($metaData)->avatar && ! empty(optional($metaData)->avatar) ? $metaData->avatar : "https://secure.gravatar.com/avatar/{$emailHash}?s=500",
            'darkMode'  => optional($metaData)->dark_mode,
            'maxUpload' => config('canvas.upload_filesize'),
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

    /**
     * Compiles the language file and rebuilds it into into a single
     * consumable JSON object that can be used in the Vue components.
     *
     * @param string
     * @return string
     */
    private static function compileLanguageFile(string $locale): string
    {
        $langDirectory = dirname(__DIR__, 1).'/resources/lang';
        $file = "{$langDirectory}/{$locale}/app.php";
        $lines = collect();
        $lines->put('app', include $file);

        return $lines->toJson();
    }
}
