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
        switch (request()->query('type')) {
            case 'draft':
                return response()->json([
                    'posts' => Post::forCurrentUser()->draft()->latest()->withCount('views')->paginate(),
                    'draftCount' => Post::forCurrentUser()->draft()->count(),
                    'publishedCount' => Post::forCurrentUser()->published()->count(),
                ], 200);
                break;

            case 'published':
                return response()->json([
                    'posts' => Post::forCurrentUser()->published()->latest()->withCount('views')->paginate(),
                    'draftCount' => Post::forCurrentUser()->draft()->count(),
                    'publishedCount' => Post::forCurrentUser()->published()->count(),
                ], 200);
                break;

            default:
                return response()->json([], 404);
                break;
        }
    }

    /**
     * Display the specified resource.
     *
     * @param $id
     * @return JsonResponse
     * @throws Exception
     */
    public function show($id): JsonResponse
    {
        if (Post::forCurrentUser()->pluck('id')->contains($id)) {
            if ($this->isNewPost($id)) {
                $uuid = Uuid::uuid4();

                return response()->json([
                    'post' => Post::make([
                        'id' => $uuid->toString(),
                        'slug' => "post-{$uuid->toString()}",
                    ]),
                    'tags' => Tag::forCurrentUser()->get(['name', 'slug']),
                    'topics' => Topic::forCurrentUser()->get(['name', 'slug']),
                ]);
            } else {
                return response()->json([
                    'post' => Post::forCurrentUser()->with('tags:name,slug', 'topic:name,slug')->find($id),
                    'tags' => Tag::forCurrentUser()->get(['name', 'slug']),
                    'topics' => Topic::forCurrentUser()->get(['name', 'slug']),
                ]);
            }
        } else {
            return response()->json(null, 404);
        }
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param string $id
     * @return JsonResponse
     * @throws Exception
     */
    public function store(string $id): JsonResponse
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
                })->ignore($this->isNewPost($id) ? null : $id),
            ],
        ], $messages)->validate();

        $post = $this->isNewPost($id) ? new Post(['id' => request('id')]) : Post::forCurrentUser()->find($id);

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
     * Remove the specified resource from storage.
     *
     * @param string $id
     * @return mixed
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
     * Return true if the given ID is for a new post.
     *
     * @param string $id
     * @return bool
     */
    private function isNewPost(string $id): bool
    {
        return $id === 'create';
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
     * @param array $incomingTags
     * @return array
     */
    private function syncTags(array $incomingTags): array
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
