<?php

namespace App\Http\Controllers\Frontend;

use Auth;
use App\Models\Tag;
use App\Models\User;
use App\Models\Post;
use App\Jobs\BlogIndexData;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class BlogController extends Controller
{
    /**
     * Display the blog index page.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $user = User::firstOrFail();
        $tag = $request->get('tag');
        $data = $this->dispatch(new BlogIndexData($tag));
        $layout = $tag ? Tag::layout($tag)->first() : config('blog.tag_layout');

        return view($layout, $data)->with(compact('user'));
    }

    /**
     * Display a blog post page.
     *
     * @param $slug
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function showPost($slug, Request $request)
    {
        $post = Post::with(['tags','author'])->whereSlug($slug)->firstOrFail();
        $user = $post->author;
        $tag = $request->get('tag');
        $title = $post->title;
        if ($tag) {
            $tag = Tag::whereTag($tag)->firstOrFail();
        }

        if ($post->is_draft && ! Auth::check()) {
            return redirect('/blog');
        }

        return view($post->layout, compact('post', 'tag', 'slug', 'title', 'user'));
    }
}
