<?php

namespace Canvas\Http\Controllers;

use Canvas\UserMeta;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class ViewController extends Controller
{
    /**
     * Handle the incoming request.
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function __invoke()
    {
        $metaData = UserMeta::forUser(request()->user())->first();
        $dependencies = json_decode(file_get_contents(base_path('composer.lock')), true)['packages'];

        return view('canvas::layout')->with([
            'config' => [
                'languageCodes' => $this->getAvailableLanguageCodes(),
                'maxUpload' => config('canvas.upload_filesize'),
                'path' => config('canvas.path'),
                'timezone' => config('app.timezone'),
                'translations' => collect(['app' => trans('canvas::app', [], optional($metaData)->locale)])->toJson(),
                'unsplash' => config('canvas.unsplash.access_key'),
                'user' => $this->getUserData(),
                'version' => collect($dependencies)->firstWhere('name', 'cnvs/canvas')['version'],
            ],
        ]);
    }

    /**
     * Return a list of available language codes.
     *
     * @return array
     */
    private function getAvailableLanguageCodes(): array
    {
        $locales = preg_grep('/^([^.])/', scandir(dirname(__DIR__, 3).'/resources/lang'));
        $translations = collect();

        foreach ($locales as $locale) {
            $translations->push($locale);
        }

        return $translations->toArray();
    }

    /**
     * Return an array of user data.
     *
     * @return array
     */
    private function getUserData(): array
    {
        $metaData = UserMeta::forUser(request()->user())->first();
        $emailHash = md5(trim(Str::lower(request()->user()->email)));

        return [
            'id' => request()->user()->id,
            'name' => request()->user()->name,
            'email' => request()->user()->email,
            'avatar' => optional($metaData)->avatar && ! empty(optional($metaData)->avatar) ? $metaData->avatar : "https://secure.gravatar.com/avatar/{$emailHash}?s=500",
            'darkMode' => optional($metaData)->dark_mode,
            'locale' => optional($metaData)->locale ?? config('app.locale'),
            'username' => optional($metaData)->username,
            'summary' => optional($metaData)->summary,
            'digest' => optional($metaData)->digest,
        ];
    }
}
