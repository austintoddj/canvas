<?php

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory;
use Illuminate\Routing\Controller;
use Illuminate\View\View;

class ViewController extends Controller
{
    /**
     * Handle the incoming request.
     *
     * @return Application|Factory|View
     */
    public function __invoke()
    {
        $user = request()->user(config('canvas.guard'));

        return view('canvas::layout')->with([
            'jsVars' => [
                'languageCodes' => Canvas::availableLanguageCodes(),
                'maxUpload' => config('canvas.upload_filesize'),
                'path' => Canvas::basePath(),
                'roles' => Canvas::availableRoles(),
                'timezone' => config('app.timezone'),
                'translations' => Canvas::availableTranslations($user->locale),
                'unsplash' => config('canvas.unsplash.access_key'),
                'user' => $user,
                'version' => Canvas::installedVersion(),
            ],
        ]);
    }
}
