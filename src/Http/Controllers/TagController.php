<?php

namespace Canvas\Http\Controllers;

use Illuminate\View\View;
use Canvas\Traits\Paginator;
use Illuminate\Routing\Controller;
use Canvas\Interfaces\TagInterface;

class TagController extends Controller
{
    use Paginator;

    const ITEMS_PER_PAGE = 5;

    /**
     * Display the specified resource.
     *
     * @param TagInterface $tagRepository Tag Repository
     * @param string       $slug          Slug
     *
     * @return View
     */
    public function show(TagInterface $tagRepository, string $slug): View
    {
        $tag = $tagRepository->findBySlug($slug);
        $posts = $tag->posts->filter(function ($post) {
            return $post->published;
        });

        $data = [
            'posts' => $this->paginate(
                $posts->sortByDesc('created_at'),
                self::ITEMS_PER_PAGE
            ),
        ];

        return view('canvas::blog.index', compact('data'));
    }
}
