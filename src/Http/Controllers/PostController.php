<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Ramsey\Uuid\Uuid;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->query('type');
        $scope = $request->query('scope');

        $posts = Post::when($scope, function ($query, $scope) use ($request) {
            if ($scope === 'all') {
                return $query;
            }

            return $query->where('user_id', $request->user()->id);
        })->when($type, function ($query, $type) {
            if ($type === 'draft') {
                return $query->draft();
            }

            return $query->published();
        })->latest()->withCount('views')->paginate();

        return response()->json([
            'posts' => $posts,
            'draftCount' => Post::where('user_id', $request->user()->id)->draft()->count(),
            'publishedCount' => Post::where('user_id', $request->user()->id)->published()->count(),
        ], 200);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function create(Request $request): JsonResponse
    {
        $uuid = Uuid::uuid4();

        return response()->json([
            'post' => Post::make([
                'id' => $uuid->toString(),
                'slug' => "post-{$uuid->toString()}",
            ]),
            'tags' => Tag::get(['name', 'slug']),
            'topics' => Topic::get(['name', 'slug']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param Request $request
     * @param $id
     * @return JsonResponse
     * @throws Exception
     */
    public function store(Request $request, $id): JsonResponse
    {
        $post = Post::where('user_id', $request->user()->id)->find($id) ?? new Post(['id' => $id]);

        $data = [
            'id' => $id,
            'slug' => $request->input('slug', $post->slug),
            'title' => $request->input('title', trans('canvas::app.title', [], optional($post->userMeta)->locale)),
            'summary' => $request->input('summary', $post->summary),
            'body' => $request->input('body', $post->body),
            'published_at' => $request->input('published_at', $post->published_at),
            'featured_image' => $request->input('featured_image', $post->featured_image),
            'featured_image_caption' => $request->input('featured_image_caption', $post->featured_image_caption),
            'meta' => [
                'title' => $request->input('meta.title', optional($post->meta)['title']),
                'description' => $request->input('meta.description', optional($post->meta)['description']),
                'canonical_link' => $request->input('meta.canonical_link', optional($post->meta)['canonical_link']),
            ],
            'user_id' => $request->user()->id,
        ];

        $rules = [
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_posts')->where(function ($query) use ($request) {
                    return $query->where('slug', $request->input('slug'))->where('user_id', $request->user()->id);
                })->ignore($id)->whereNull('deleted_at'),
            ],
        ];

        $messages = [
            'required' => trans('canvas::app.validation_required', [], optional($post->userMeta)->locale),
            'unique' => trans('canvas::app.validation_unique', [], optional($post->userMeta)->locale),
        ];

        validator($data, $rules, $messages)->validate();

        $post->fill($data);

        $post->save();

        $post->topic()->sync($this->syncTopic($request->input('topic', [])));

        $post->tags()->sync($this->syncTags($request->input('tags', [])));

        return response()->json($post->refresh(), 201);
    }

    /**
     * Display the specified resource.
     *
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function show(Request $request, $id): JsonResponse
    {
        if (Post::where('user_id', $request->user()->id)->pluck('id')->contains($id)) {
            return response()->json([
                'post' => Post::where('user_id', $request->user()->id)->with('tags:name,slug', 'topic:name,slug')->find($id),
                'tags' => Tag::get(['name', 'slug']),
                'topics' => Topic::get(['name', 'slug']),
            ]);
        } else {
            return response()->json(null, 404);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param Request $request
     * @param $id
     * @return mixed
     */
    public function destroy(Request $request, $id)
    {
        $post = Post::where('user_id', $request->user()->id)->findOrFail($id);

        $post->delete();

        return response()->json(null, 204);
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
        if (collect($incomingTopic)->isEmpty()) {
            return [];
        }

        $topic = Topic::firstWhere('slug', $incomingTopic['slug']);

        if (! $topic) {
            $topic = Topic::create([
                'id' => $id = Uuid::uuid4()->toString(),
                'name' => $incomingTopic['name'],
                'slug' => $incomingTopic['slug'],
                'user_id' => request()->user()->id,
            ]);
        }

        return collect((string) $topic->id)->toArray();
    }

    /**
     * Sync the tags assigned to the post.
     *
     * @param $incomingTags
     * @return array
     */
    private function syncTags($incomingTags): array
    {
        if (collect($incomingTags)->isEmpty()) {
            return [];
        }

        $tags = Tag::get(['id', 'name', 'slug']);

        return collect($incomingTags)->map(function ($incomingTag) use ($tags) {
            $tag = $tags->firstWhere('slug', $incomingTag['slug']);

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
    }
}
