<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Tag;
use App\Models\User;
use App\Models\Post;
use App\Jobs\BlogIndexData;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class BlogController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $user = User::findOrFail(1);
        $tag = $request->get('tag');
        $data = $this->dispatch(new BlogIndexData($tag));
        $layout = $tag ? Tag::layout($tag)->first() : 'frontend.blog.index';

        return view($layout, $data)->with(compact('user'));
    }

    /**
     * Display the specified resource.
     *
     * @param \Illuminate\Http\Request $request
     *
     * @return \Illuminate\Http\Response
     */
    public function showPost(Request $request)
    {
        $user = User::findOrFail(1);
        $required = config('blog.post_params', []);
        $post = Post::with('tags')
            ->when(in_array('slug', $required), function($query) use($request) {
                return $query->whereSlug($request->route('slug'));
            })
            ->when(in_array('id', $required), function($query) use($request) {
                return $query->whereId($request->route('id'));
            })
            ->when(in_array('year', $required), function($query) use($request) {
                return $query->whereYear('published_at', $request->route('year'));
            })
            ->when(in_array('month', $required), function($query) use($request) {
                return $query->whereMonth('published_at', $request->route('month'));
            })
            ->when(in_array('day', $required), function($query) use($request) {
                return $query->whereDay('published_at', $request->route('day'));
            })
            ->firstOrFail();

        $tag = $request->get('tag');
        $title = $post->title;
        if ($tag) {
            $tag = Tag::whereTag($tag)->firstOrFail();
        }

        return view($post->layout, compact('post', 'tag', 'slug', 'title', 'user'));
    }
}
