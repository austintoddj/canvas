<?php

namespace Canvas\Http\Controllers;

use Canvas\Tag;
use Canvas\Post;
use Canvas\Topic;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;

class PostController extends Controller
{
    /**
     * Get all of the posts.
     *
     * @return \Illuminate\View\View
     */
    public function index()
    {
        $data = [
            'posts' => Post::orderByDesc('created_at')->get(),
        ];

        return view('canvas::posts.index', compact('data'));
    }

    /**
     * Create a new post.
     *
     * @return \Illuminate\View\View
     */
    public function create()
    {
        $data = [
            'id'     => Str::uuid(),
            'tags'   => Tag::all(['name', 'slug']),
            'topics' => Topic::all(['name', 'slug']),
        ];

        return view('canvas::posts.create', compact('data'));
    }

    /**
     * Edit a given post.
     *
     * @param string $id
     * @return \Illuminate\View\View
     */
    public function edit(string $id)
    {
        $post = Post::findOrFail($id);

        $data = [
            'post'   => $post,
            'meta'   => $post->meta,
            'tags'   => Tag::all(['name', 'slug']),
            'topics' => Topic::all(['name', 'slug']),
        ];

        return view('canvas::posts.edit', compact('data'));
    }

    /**
     * Save a new post.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store()
    {
        $data = [
            'id'                     => request('id'),
            'slug'                   => request('slug'),
            'title'                  => request('title', 'Post Title'),
            'summary'                => request('summary', null),
            'body'                   => request('body', null),
            'published_at'           => Carbon::parse(request('published_at'))->toDateTimeString(),
            'featured_image'         => request('featured_image', null),
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

        $messages = [
            'unique' => __('canvas::validation.unique'),
        ];

        validator($data, [
            'title'        => 'required',
            'slug'         => 'required|'.Rule::unique('canvas_posts', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
            'published_at' => 'required|date',
            'user_id'      => 'required',
        ], $messages)->validate();

        $post = new Post(['id' => request('id')]);
        $post->fill($data);
        $post->meta = $data['meta'];
        $post->save();

        $post->tags()->sync(
            $this->collectTags(request('tags') ?? [])
        );

        $post->topic()->sync(
            $this->assignTopic(request('topic') ?? [])
        );

        return redirect(route('canvas.post.edit', $post->id))->with('notify', __('canvas::nav.notify.success'));
    }

    /**
     * Save a given post.
     *
     * @param string $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(string $id)
    {
        $post = Post::findOrFail($id);

        $data = [
            'id'                     => request('id'),
            'slug'                   => request('slug'),
            'title'                  => request('title', 'Post Title'),
            'summary'                => request('summary', null),
            'body'                   => request('body', null),
            'published_at'           => Carbon::parse(request('published_at'))->toDateTimeString(),
            'featured_image'         => request('featured_image', $post->featured_image),
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

        $messages = [
            'unique' => __('canvas::validation.unique'),
        ];

        validator($data, [
            'title'        => 'required',
            'slug'         => 'required|'.Rule::unique('canvas_posts', 'slug')->ignore($id).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
            'published_at' => 'required',
            'user_id'      => 'required',
        ], $messages)->validate();

        $post->fill($data);
        $post->meta = $data['meta'];
        $post->save();

        $post->tags()->sync(
            $this->collectTags(request('tags') ?? [])
        );

        $post->topic()->sync(
            $this->assignTopic(request('topic') ?? [])
        );

        return redirect(route('canvas.post.edit', $post->id))->with('notify', __('canvas::nav.notify.success'));
    }

    /**
     * Delete a given post.
     *
     * @param string $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(string $id)
    {
        $post = Post::findOrFail($id);
        $post->delete();

        return redirect(route('canvas.post.index'));
    }

    /**
     * Collect or create given tags.
     *
     * @param  array $incomingTags
     * @return array
     *
     * @author Mohamed Said <themsaid@gmail.com>
     */
    private function collectTags(array $incomingTags): array
    {
        $tags = Tag::all();

        return collect($incomingTags)->map(function ($incomingTag) use ($tags) {
            $tag = $tags->where('slug', $incomingTag['slug'])->first();

            if (! $tag) {
                $tag = Tag::create([
                    'id'   => $id = Str::uuid(),
                    'name' => $incomingTag['name'],
                    'slug' => $incomingTag['slug'],
                ]);
            }

            return (string) $tag->id;
        })->toArray();
    }

    /**
     * Assign a given topic.
     *
     * @param $incomingTopic
     * @return mixed
     */
    private function assignTopic(array $incomingTopic)
    {
        if ($incomingTopic) {
            $topic = Topic::where('slug', $incomingTopic['slug'])->first();

            if (! $topic) {
                $topic = Topic::create([
                    'id'   => $id = Str::uuid(),
                    'name' => $incomingTopic['name'],
                    'slug' => $incomingTopic['slug'],
                ]);
            }

            return collect((string) $topic->id)->toArray();
        } else {
            return [];
        }
    }
}
