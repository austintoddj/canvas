<?php

declare(strict_types=1);

namespace Canvas;

use Composer\InstalledVersions;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use RuntimeException;

class Canvas
{
    /**
     * Return the installed version.
     *
     * @return string
     */
    public static function installedVersion()
    {
        if (app()->runningUnitTests()) {
            return '';
        }

        return InstalledVersions::getPrettyVersion('austintoddj/canvas');
    }

    /**
     * Return a list of available language codes.
     *
     * @return array
     */
    public static function availableLanguageCodes()
    {
        $locales = preg_grep('/^([^.])/', scandir(dirname(__DIR__).'/lang'));

        return collect($locales)->each(function ($code) {
            return $code;
        })->toArray();
    }

    /**
     * Return an encoded string of app translations.
     *
     * @param  $locale
     * @return string
     */
    public static function availableTranslations($locale)
    {
        return collect(trans('canvas::app', [], $locale))->toJson();
    }

    /**
     * Return true if the publishable assets are up-to-date.
     *
     * @return bool
     */
    public static function assetsUpToDate()
    {
        if (app()->runningUnitTests()) {
            return true;
        }

        $path = public_path('vendor/canvas/mix-manifest.json');

        if (! File::exists($path)) {
            throw new RuntimeException(vsprintf('%s%s. %s', [
                trans('canvas::app.assets_are_not_up_to_date'),
                trans('canvas::app.to_update_run'),
                'php artisan canvas:publish',
            ]));
        }

        return File::get($path) === File::get(dirname(__DIR__).'/public/mix-manifest.json');
    }

    /**
     * Return the configured base path url.
     *
     * @return string
     */
    public static function basePath()
    {
        return sprintf('/%s', config('canvas.path'));
    }

    /**
     * Return the configured storage path url for images.
     *
     * @return string
     */
    public static function baseStoragePathForImages()
    {
        return sprintf('%s/images', config('canvas.storage_path'));
    }

    /**
     * Return a valid host URL or null.
     *
     * @param  string|null  $url
     * @return string|null
     */
    public static function parseReferer(?string $url)
    {
        if (filter_var($url, FILTER_VALIDATE_URL)) {
            return parse_url($url)['host'];
        }

        return null;
    }

    /**
     * Generate a Gravatar for a given email.
     *
     * @param  string  $email
     * @param  int  $size
     * @param  string  $default
     * @param  string  $rating
     * @return string
     */
    public static function gravatar(
        string $email,
        int $size = 200,
        string $default = 'retro',
        string $rating = 'g'
    ) {
        $hash = md5(trim(Str::lower($email)));

        return "https://secure.gravatar.com/avatar/{$hash}?s={$size}&d={$default}&r={$rating}";
    }

    /**
     * Return true if dark mode is enabled.
     *
     * @param  int|null  $enabled
     * @return bool
     */
    public static function enabledDarkMode(?int $enabled)
    {
        return (bool) $enabled;
    }

    /**
     * Return true if the app is configured to use Arabic or Farsi.
     *
     * @param  string|null  $locale
     * @return bool
     */
    public static function usingRightToLeftLanguage(?string $locale)
    {
        return in_array($locale, ['ar', 'fa']);
    }
}
