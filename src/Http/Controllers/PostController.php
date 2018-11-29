<?php

namespace Canvas\Http\Controllers;

use Canvas\Tag;
use Canvas\Post;
use Carbon\Carbon;
use Illuminate\View\View;
use Illuminate\Support\Str;
use Canvas\Events\PostViewed;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;
use Illuminate\Http\RedirectResponse;

class PostController extends Controller
{
    /**
     * Display a listing of posts.
     *
     * @return View
     */
    public function index(): View
    {
        $data = [
            'posts' => Post::orderByDesc('created_at')->with('tags')->paginate(10),
        ];

        return view('canvas::canvas.posts.index', compact('data'));
    }

    /**
     * Display a single post.
     *
     * @param string $slug
     * @return View
     */
    public function show(string $slug): View
    {
        $post = Post::with('tags')->where('slug', $slug)->first();

        $data = [
            'post' => $post,
            'meta' => $post->meta,
        ];

        event(new PostViewed($data['post']));

        return view('canvas::blog.show', compact('data'));
    }

    /**
     * Show the form for creating a post.
     *
     * @return View
     */
    public function create(): View
    {
        $data = [
            'id'   => Str::uuid(),
            'tags' => Tag::all(),
        ];

        return view('canvas::canvas.posts.create', compact('data'));
    }

    /**
     * Show the form for editing a post.
     *
     * @param string $id
     * @return View
     */
    public function edit(string $id): View
    {
        $post = Post::findOrFail($id);

        $data = [
            'post' => $post,
            'meta' => $post->meta,
        ];

        return view('canvas::canvas.posts.edit', compact('data'));
    }

    /**
     * Store a newly created post in storage.
     *
     * @return RedirectResponse
     */
    public function store(): RedirectResponse
    {
        $data = [
            'id'           => request('id'),
            'title'        => request('title', 'Post Title'),
            'summary'      => request('summary'),
            'slug'         => request('slug'),
            'body'         => request('body'),
            'user_id'      => auth()->user()->id,
            'meta'         => [
                'meta_description'    => request('meta_description', null),
                'og_title'            => request('og_title', null),
                'og_description'      => request('og_description', null),
                'twitter_title'       => request('twitter_title', null),
                'twitter_description' => request('twitter_description', null),
            ],
            'published_at' => Carbon::parse(request('published_at'))->toDateTimeString(),
        ];

        validator($data, [
            'published_at' => 'required|date',
            'user_id'      => 'required',
            'title'        => 'required',
            'slug'         => 'required|'.Rule::unique('canvas_posts', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ])->validate();

        $post = new Post(['id' => request('id')]);
        $post->fill($data);
        $post->meta = $data['meta'];
        $post->save();
        $post->tags()->sync(
            $this->collectTags(request('tags') ?? [])
        );

        return redirect(route('canvas.post.index'))
            ->with('success', 'The post has been created.');
    }

    /**
     * Update a post in storage.
     *
     * @param string $id
     * @return RedirectResponse
     */
    public function update(string $id): RedirectResponse
    {
        $post = Post::findOrFail($id);

        $data = [
            'title'        => request('title'),
            'summary'      => request('summary', null),
            'slug'         => request('slug'),
            'body'         => request('body', null),
            'user_id'      => $post->user_id,
            'meta'         => [
                'meta_description'    => request('meta_description', null),
                'og_title'            => request('og_title', null),
                'og_description'      => request('og_description', null),
                'twitter_title'       => request('twitter_title', null),
                'twitter_description' => request('twitter_description', null),
            ],
            'published_at' => Carbon::parse(request('published_at'))->toDateTimeString(),
        ];

        validator($data, [
            'published_at' => 'required',
            'user_id'      => 'required',
            'title'        => 'required',
            'slug'         => 'required|'.Rule::unique('canvas_posts', 'slug')->ignore($id).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ])->validate();

        $post->fill($data);
        $post->meta = $data['meta'];
        $post->save();
        $post->tags()->sync(
            $this->collectTags(request('tags') ?? [])
        );

        return redirect(route('canvas.post.index'))
            ->with('success', 'The post has been updated.');
    }

    /**
     * Soft delete a post in storage.
     *
     * @param string $id
     * @return RedirectResponse
     */
    public function destroy(string $id): RedirectResponse
    {
        $post = Post::findOrFail($id);
        $post->delete();

        return redirect(route('canvas.post.index'))
            ->with('success', 'The post has been deleted.');
    }

    /**
     * Collect tags from the request.
     *
     * @param  array $incomingTags
     * @return array
     */
    private function collectTags(array $incomingTags): array
    {
        $tags = Tag::all();

        return collect($incomingTags)->map(function ($incomingTag) use ($tags) {
            $tag = $tags->where('slug', Str::slug($incomingTag['name']))->first();
            if (! $tag) {
                $tag = Tag::create([
                    'id'   => $id = Str::uuid(),
                    'name' => $incomingTag['name'],
                    'slug' => Str::slug($incomingTag['name']),
                ]);
            }

            return (string) $tag->id;
        })->toArray();
    }
}
