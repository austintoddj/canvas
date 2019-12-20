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
            'lang'     => self::collectLanguageFiles(config('app.locale')),
            'path'     => config('canvas.path'),
            'timezone' => config('app.timezone'),
            'unsplash' => config('canvas.unsplash.access_key'),
            'user'     => auth()->user()->only(['name', 'email']),
            'avatar'   => optional($metaData)->avatar && ! empty(optional($metaData)->avatar) ? $metaData->avatar : "https://secure.gravatar.com/avatar/{$emailHash}?s=500",
            'darkMode' => optional($metaData)->dark_mode,
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
            throw new RuntimeException('The assets for Canvas are not up to date. Please run: php artisan canvas:publish');
        }

        return File::get($path) === File::get(__DIR__.'/../public/mix-manifest.json');
    }

    /**
     * Gather all the language files and rebuild them into into a single
     * consumable JSON object that can be used in the Vue components.
     *
     * @param string
     * @return string
     */
    private static function collectLanguageFiles(string $locale): string
    {
        $langDirectory = dirname(__DIR__, 1).'/resources/lang';
        $files = collect(glob("{$langDirectory}/{$locale}/*.php"));
        $lines = collect();

        foreach ($files as $file) {
            $filename = basename($file, '.php');
            $lines->put($filename, include $file);
        }

        return $lines->toJson();
    }
}
