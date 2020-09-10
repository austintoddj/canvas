<?php

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\StorePostRequest;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
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
        $type = $request->query('type', 'published');
        $scope = $request->query('scope', 'user');

        $posts = Post::when($scope, function ($query, $scope) use ($request) {
            if ($scope === 'all') {
                return $query;
            }

            return $query->where('user_id', $request->user('canvas')->id);
        })->when($type, function ($query, $type) {
            if ($type === 'draft') {
                return $query->draft();
            }

            return $query->published();
        })->latest()->withCount('views')->paginate();

        return response()->json([
            'posts' => $posts,
            'draftCount' => Post::where('user_id', $request->user('canvas')->id)->draft()->count(),
            'publishedCount' => Post::where('user_id', $request->user('canvas')->id)->published()->count(),
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
     * @param StorePostRequest $request
     * @param $id
     * @return JsonResponse
     * @throws Exception
     */
    public function store(StorePostRequest $request, $id): JsonResponse
    {
        $data = $request->validated();

        if ($request->user('canvas')->isAdmin) {
            $post = Post::find($id);
        } else {
            $post = Post::where('user_id', $request->user('canvas')->id)->find($id);
        }

        if (! $post) {
            $post = new Post(['id' => $id]);
        }

        $post->fill($data);

        $post->user_id = $request->user('canvas')->id;

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
        if (Post::where('user_id', $request->user('canvas')->id)->pluck('id')->contains($id)) {
            return response()->json([
                'post' => Post::where('user_id', $request->user('canvas')->id)->with('tags:name,slug', 'topic:name,slug')->find($id),
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
        $post = Post::where('user_id', $request->user('canvas')->id)->findOrFail($id);

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
                'user_id' => request()->user('canvas')->id,
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
                    'user_id' => request()->user('canvas')->id,
                ]);
            }

            return (string) $tag->id;
        })->toArray();
    }
}
