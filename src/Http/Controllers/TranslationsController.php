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
        return response()->json(Localization::dictionary($locale));
    }
}
