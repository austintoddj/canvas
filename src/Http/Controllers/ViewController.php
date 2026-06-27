<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Support\FrontendBootData;
use Illuminate\Routing\Controller;
use Illuminate\View\View;

class ViewController extends Controller
{
    public function __invoke(): View
    {
        return view('canvas::layout')->with([
            'jsVars' => FrontendBootData::forUser(request()->user(config('canvas.guard'))),
        ]);
    }
}
