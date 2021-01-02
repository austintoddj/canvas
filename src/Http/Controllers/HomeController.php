<?php

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory;
use Illuminate\Routing\Controller;
use Illuminate\View\View;

class HomeController extends Controller
{
    /**
     * Handle the incoming request.
     *
     * @return Application|Factory|View
     */
    public function index()
    {
        return view('canvas::layout')->with([
            'config' => [
                'languageCodes' => Canvas::availableLanguageCodes(),
                'maxUpload' => config('canvas.upload_filesize'),
                'path' => Canvas::basePath(),
                'roles' => Canvas::availableRoles(),
                'timezone' => config('app.timezone'),
                'translations' => Canvas::availableTranslations(request()->user(config('canvas.auth_guard'))->locale),
                'unsplash' => config('canvas.unsplash.access_key'),
                'user' => request()->user(config('canvas.auth_guard')),
                'version' => Canvas::installedVersion(),
                'logo' => config('canvas.logo'),
            ],
        ]);
    }
}
