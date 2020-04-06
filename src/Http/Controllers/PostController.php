<?php

namespace Canvas\Http\Controllers;

use Canvas\Post;
use Canvas\Tag;
use Canvas\Topic;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Ramsey\Uuid\Uuid;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $publishedCount = Post::forCurrentUser()->published()->count();
        $draftCount = Post::forCurrentUser()->draft()->count();

        switch (request()->query('type')) {
            case 'draft':
                return response()->json([
                    'posts' => Post::forCurrentUser()->draft()->latest()->withCount('views')->paginate(),
                    'draftCount' => $draftCount,
                    'publishedCount' => $publishedCount,
                ], 200);
                break;

            case 'published':
                return response()->json([
                    'posts' => Post::forCurrentUser()->published()->latest()->withCount('views')->paginate(),
                    'draftCount' => $draftCount,
                    'publishedCount' => $publishedCount,
                ], 200);
                break;

            default:
                return response()->json([], 404);
                break;
        }
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return JsonResponse
     */
    public function create()
    {
        $uuid = Uuid::uuid4();

        return response()->json([
            'id' => $uuid->toString(),
            'slug' => "post-{$uuid->toString()}",
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return JsonResponse
     * @throws Exception
     */
    public function store(): JsonResponse
    {
        $data = [
            'id' => request('id'),
            'slug' => request('slug'),
            'title' => request('title', 'Title'),
            'summary' => request('summary', null),
            'body' => request('body', null),
            'published_at' => request('published_at', null),
            'featured_image' => request('featured_image', null),
            'featured_image_caption' => request('featured_image_caption', null),
            'user_id' => request()->user()->id,
            'meta' => [
                'description' => request('meta.description', null),
                'title' => request('meta.title', null),
                'canonical_link' => request('meta.canonical_link', null),
            ],
        ];

        $messages = [
            'required' => __('canvas::app.validation_required'),
            'unique' => __('canvas::app.validation_unique'),
        ];

        validator($data, [
            'user_id' => 'required',
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_posts')->where(function ($query) use ($data) {
                    return $query->where('slug', $data['slug'])->where('user_id', $data['user_id']);
                }),
            ],
        ], $messages)->validate();

        $post = new Post(['id' => request('id')]);

        $post->fill($data);
        $post->meta = $data['meta'];
        $post->save();

        $post->topic()->sync(
            $this->syncTopic(request('topic'))
        );

        $post->tags()->sync(
            $this->syncTags(request('tags'))
        );

        return response()->json($post->refresh(), 201);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param $id
     * @return JsonResponse
     */
    public function edit($id)
    {
        $posts = Post::forCurrentUser();

        if ($posts->pluck('id')->contains($id)) {
            return response()->json([
                'post' => $posts->with('tags:name,slug', 'topic:name,slug')->find($id),
                'tags' => Tag::forCurrentUser()->get(['name', 'slug']),
                'topics' => Topic::forCurrentUser()->get(['name', 'slug']),
            ], 200);
        } else {
            return response()->json(null, 404);
        }
    }

    /**
     * Update the specified resource in storage.
     *
     * @param $id
     * @return JsonResponse
     * @throws Exception
     */
    public function update($id)
    {
        $post = Post::forCurrentUser()->find($id);

        if ($post) {
            $data = [
                'id' => request('id'),
                'slug' => request('slug'),
                'title' => request('title', 'Title'),
                'summary' => request('summary', null),
                'body' => request('body', null),
                'published_at' => request('published_at', null),
                'featured_image' => request('featured_image', null),
                'featured_image_caption' => request('featured_image_caption', null),
                'user_id' => request()->user()->id,
                'meta' => [
                    'description' => request('meta.description', null),
                    'title' => request('meta.title', null),
                    'canonical_link' => request('meta.canonical_link', null),
                ],
            ];

            $messages = [
                'required' => __('canvas::app.validation_required'),
                'unique' => __('canvas::app.validation_unique'),
            ];

            validator($data, [
                'user_id' => 'required',
                'slug' => [
                    'required',
                    'alpha_dash',
                    Rule::unique('canvas_posts')->where(function ($query) use ($data) {
                        return $query->where('slug', $data['slug'])->where('user_id', $data['user_id']);
                    })->ignore($id),
                ],
            ], $messages)->validate();

            $post->fill($data);
            $post->meta = $data['meta'];
            $post->save();

            $post->topic()->sync(
                $this->syncTopic(request('topic'))
            );

            $post->tags()->sync(
                $this->syncTags(request('tags'))
            );

            return response()->json($post->refresh(), 200);
        } else {
            return response()->json(null, 404);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id)
    {
        $post = Post::find($id);

        if ($post) {
            $post->delete();

            return response()->json(null, 204);
        } else {
            return response()->json(null, 404);
        }
    }

    /**
     * Sync the topic assigned to the post.
     *
     * @param $incomingTopic
     * @return array
     * @throws Exception
     */
    private function syncTopic($incomingTopic): array
    {
        if ($incomingTopic) {
            $topic = Topic::forCurrentUser()->where('slug', $incomingTopic['slug'])->first();

            if (! $topic) {
                $topic = Topic::create([
                    'id' => $id = Uuid::uuid4()->toString(),
                    'name' => $incomingTopic['name'],
                    'slug' => $incomingTopic['slug'],
                    'user_id' => request()->user()->id,
                ]);
            }

            return collect((string) $topic->id)->toArray();
        } else {
            return [];
        }
    }

    /**
     * Sync the tags assigned to the post.
     *
     * @param $incomingTags
     * @return array
     */
    private function syncTags($incomingTags): array
    {
        if ($incomingTags) {
            $tags = Tag::forCurrentUser()->get(['id', 'name', 'slug']);

            return collect($incomingTags)->map(function ($incomingTag) use ($tags) {
                $tag = $tags->where('slug', $incomingTag['slug'])->first();

                if (! $tag) {
                    $tag = Tag::create([
                        'id' => $id = Uuid::uuid4()->toString(),
                        'name' => $incomingTag['name'],
                        'slug' => $incomingTag['slug'],
                        'user_id' => request()->user()->id,
                    ]);
                }

                return (string) $tag->id;
            })->toArray();
        } else {
            return [];
        }
    }
}
