<?php

namespace Canvas\Http\Controllers;

use Illuminate\View\View;
use Canvas\Traits\Paginator;
use Illuminate\Routing\Controller;
use Canvas\Interfaces\PostInterface;

class BlogController extends Controller
{
    use Paginator;

    const ITEMS_PER_PAGE = 10;

    /**
     * Show the public-facing blog homepage.
     *
     * @param PostInterface $postRepository Post Repository
     *
     * @return View
     */
    public function index(PostInterface $postRepository): View
    {
        $data = [
            'posts' => $this->paginate(
                $postRepository->getPublished()->sortByDesc('created_at'),
                self::ITEMS_PER_PAGE
            ),
        ];

        return view('canvas::blog.index', compact('data'));
    }
}
