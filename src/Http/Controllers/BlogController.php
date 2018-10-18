<?php

namespace Canvas\Http\Controllers;

use Illuminate\View\View;

class BlogController extends Controller
{
    /**
     * Show the public-facing blog homepage.
     *
     * @return View
     */
    public function index(): View
    {
        return view('canvas::blog.index');
    }

    public function showPost($id)
    {
    }

    public function showTag($id)
    {
    }
}
