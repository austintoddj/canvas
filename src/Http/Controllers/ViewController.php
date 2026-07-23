<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Support\FrontendBootData;
use Canvas\Support\Localization;
use Illuminate\Routing\Controller;
use Illuminate\View\View;

class ViewController extends Controller
{
    public function __invoke(): View
    {
        $user = request()->user(config('canvas.guard'));
        $jsVars = FrontendBootData::forUser($user);
        $locale = Localization::resolveLocale(data_get($jsVars, 'user.canvas.locale'));

        app()->setLocale(Localization::resolveTranslationLocale($locale));

        return view('canvas::layout', [
            'jsVars' => $jsVars,
            'htmlLang' => str_replace('_', '-', $locale),
            'htmlDir' => Localization::isRightToLeftLanguage($locale) ? 'rtl' : 'ltr',
        ]);
    }
}
