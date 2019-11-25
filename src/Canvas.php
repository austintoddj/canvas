<?php

namespace Canvas;

use Illuminate\Support\Facades\File;
use RuntimeException;

class Canvas
{
    /**
     * Indicates if Canvas should utilize the dark mode.
     *
     * @var bool
     */
    public static $useDarkMode = false;

    /**
     * Build a global JavaScript object for the Vue app.
     *
     * @return array
     */
    public static function scriptVariables()
    {
        return [
            'lang'     => self::collectLanguageFiles(),
            'path'     => config('canvas.path'),
            'timezone' => config('app.timezone'),
            'unsplash' => config('canvas.unsplash.access_key'),
            'user'     => auth()->user()->only(['name', 'email']),
        ];
    }

    /**
     * Specifies that Canvas should apply the dark mode.
     *
     * @return static
     */
    public static function night()
    {
        static::$useDarkMode = true;

        return new static;
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
     * @return string
     */
    private static function collectLanguageFiles(): string
    {
        $files = glob(sprintf('%s/resources/lang/%s/*.php', dirname(__DIR__, 1), config('app.locale')));
        $lines = collect();

        foreach ($files as $file) {
            $filename = basename($file, '.php');
            $lines->put($filename, require $file);
        }

        return json_encode($lines->toArray());
    }
}
