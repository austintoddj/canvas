<?php

namespace Canvas\Http\Controllers;

use Canvas\Paginate;
use Illuminate\View\View;
use Canvas\Interfaces\PostInterface;

class BlogController extends Controller
{
    use Paginate;

    /**
     * Show the public-facing blog homepage.
     *
     * @return View
     */
    public function index(): View
    {
        $data = [
            'posts' => $this->paginate(app(PostInterface::class)->getPublished()->sortByDesc('created_at'), 10),
        ];

        return view('canvas::blog.index', compact('data'));
    }
}
