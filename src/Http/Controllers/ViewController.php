<?php

namespace Canvas\Http\Controllers;

use Canvas\UserMeta;
use Illuminate\Routing\Controller;

class ViewController extends Controller
{
    /**
     * Handle the incoming request.
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\View\View
     */
    public function __invoke()
    {
        return view('canvas::layout')->with([
            'dark' => optional(UserMeta::forUser(request()->user())->first())->dark_mode ?? false,
        ]);
    }
}
