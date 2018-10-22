<?php

namespace Canvas\Http\Controllers;

use Illuminate\View\View;
use Canvas\Interfaces\TagInterface;

class TagController extends Controller
{
    public function show($slug): View
    {
        $tag = app(TagInterface::class)->findBySlug($slug);

        $posts = $tag->posts->filter(function ($post) {
            return $post->published;
        });

        $data = [
            'posts' => $posts,
        ];

        return view('canvas::blog.index', compact('data'));
    }
}
