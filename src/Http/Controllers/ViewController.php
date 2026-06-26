<?php

namespace Canvas\Http\Controllers;

use Canvas\Support\FrontendBootData;
use Illuminate\Routing\Controller;
use Illuminate\View\View;

class ViewController extends Controller
{
    public function __invoke(): View
    {
        $user = request()->user(config('canvas.guard'));

        return view('canvas::layout')->with([
            'jsVars' => FrontendBootData::forUser($user),
        ]);
    }
}
