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
use Illuminate\Support\Facades\Storage;

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
        $posts = Post::with('tags')->published()->get();
        $post = $posts->firstWhere('slug', $slug);

        if (optional($post)->published) {
            $next = $posts->sortBy('published_at')->firstWhere('published_at', '>', optional($post)->published_at);

            $filtered = $posts->filter(function ($value, $key) use ($slug, $next) {
                return $value->slug != $slug && $value->slug != optional($next)->slug;
            });

            if ($post->tags->isNotEmpty()) {
                $related = Post::whereHas('tags', function ($query) use ($post, $next) {
                    return $query->whereIn('name', $post->tags->pluck('slug'));
                })
                    ->where('id', '!=', $post->id)
                    ->where('id', '!=', optional($next)->id)
                    ->get();

                $random = $related->isEmpty() ? $filtered->random() : $related->random();
            } else {
                $random = $filtered->random();
            }

            $data = [
                'author' => $post->author,
                'post'   => $post,
                'meta'   => $post->meta,
                'next'   => $next,
                'random' => $random,
            ];

            event(new PostViewed($post));

            return view('canvas::blog.show', compact('data'));
        } else {
            abort(404);
        }
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
            'tags' => Tag::all(),
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
        dd(request()->all());

        $data = [
            'id'                     => request('id'),
            'slug'                   => request('slug'),
            'title'                  => request('title', 'Post Title'),
            'summary'                => request('summary', null),
            'body'                   => request('body', null),
            'published_at'           => Carbon::parse(request('published_at'))->toDateTimeString(),
            'featured_image'         => request()->file('featured_image', null),
            'featured_image_caption' => request('featured_image_caption', null),
            'user_id'                => auth()->user()->id,
            'meta'                   => [
                'meta_description'    => request('meta_description', null),
                'og_title'            => request('og_title', null),
                'og_description'      => request('og_description', null),
                'twitter_title'       => request('twitter_title', null),
                'twitter_description' => request('twitter_description', null),
            ],
        ];

        validator($data, [
            'title'        => 'required',
            'slug'         => 'required|'.Rule::unique('canvas_posts', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
            'published_at' => 'required|date',
            'user_id'      => 'required',
        ])->validate();

        $post = new Post(['id' => request('id')]);
        $post->fill($data);

        if (! is_null($data['featured_image'])) {
            $post->featured_image = $this->uploadImage($data['featured_image']);
        }

        $post->meta = $data['meta'];
        $post->save();

        if (! is_null(request('tags'))) {
            $post->tags()->sync(
                $this->collectTags(request('tags') ?? [])
            );
        }

        return redirect(route('canvas.post.edit', $post->id))->with('notify', 'Saved!');
    }

    /**
     * Update a post in storage.
     *
     * @param string $id
     * @return RedirectResponse
     */
    public function update(string $id): RedirectResponse
    {
        dd(request()->all());

        $post = Post::findOrFail($id);

        $data = [
            'id'                     => request('id'),
            'slug'                   => request('slug'),
            'title'                  => request('title', 'Post Title'),
            'summary'                => request('summary', null),
            'body'                   => request('body', null),
            'published_at'           => Carbon::parse(request('published_at'))->toDateTimeString(),
            'featured_image'         => request()->file('featured_image', $post->featured_image),
            'featured_image_caption' => request('featured_image_caption', null),
            'user_id'                => $post->user->id,
            'meta'                   => [
                'meta_description'    => request('meta_description', null),
                'og_title'            => request('og_title', null),
                'og_description'      => request('og_description', null),
                'twitter_title'       => request('twitter_title', null),
                'twitter_description' => request('twitter_description', null),
            ],
        ];

        validator($data, [
            'title'        => 'required',
            'slug'         => 'required|'.Rule::unique('canvas_posts', 'slug')->ignore($id).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
            'published_at' => 'required',
            'user_id'      => 'required',
        ])->validate();

        if ($data['featured_image'] != $post->featured_image) {
            $data['featured_image'] = $this->uploadImage($data['featured_image']);
        }

        $post->fill($data);
        $post->meta = $data['meta'];
        $post->save();

        if (! is_null(request('tags'))) {
            $post->tags()->sync(
                $this->collectTags(request('tags') ?? [])
            );
        }

        return redirect(route('canvas.post.edit', $post->id))->with('notify', 'Saved!');
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

        return redirect(route('canvas.post.index'));
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
