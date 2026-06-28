<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Support\Localization;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class TranslationsController extends Controller
{
    public function __invoke(string $locale): JsonResponse
    {
        if (! in_array($locale, Localization::availableLanguageCodes(), true)) {
            $locale = config('app.locale');
        }

        return response()->json(trans('canvas::app', [], $locale));
    }
}
