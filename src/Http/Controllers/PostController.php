<?php

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\PostRequest;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
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
        $posts = Post::query()
                     ->when(request()->user('canvas')->isContributor || request()->query('scope', 'user') != 'all',
                         fn (Builder $query) => $query->where('user_id', request()->user('canvas')->id),
                         fn (Builder $query) => $query)
                     ->when(request()->query('type', 'published') != 'draft',
                         fn (Builder $query) => $query->published(),
                         fn (Builder $query) => $query->draft())
                     ->latest()
                     ->withCount('views')
                     ->paginate();

        $draftCount = Post::query()
                          ->when(request()->user('canvas')->isContributor || request()->query('scope', 'user') != 'all',
                              fn (Builder $query) => $query->where('user_id', request()->user('canvas')->id),
                              fn (Builder $query) => $query)
                          ->draft()
                          ->count();

        $publishedCount = Post::query()
                              ->when(request()->user('canvas')->isContributor || request()->query('scope', 'user') != 'all',
                                  fn (Builder $query) => $query->where('user_id', request()->user('canvas')->id),
                                  fn (Builder $query) => $query)
                              ->published()
                              ->count();

        return response()->json([
            'posts' => $posts,
            'draftCount' => $draftCount,
            'publishedCount' => $publishedCount,
        ], 200);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return JsonResponse
     */
    public function create(): JsonResponse
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
     * @param PostRequest $request
     * @param $id
     * @return JsonResponse
     * @throws Exception
     */
    public function store(PostRequest $request, $id): JsonResponse
    {
        $data = $request->validated();

        $post = Post::query()
                    ->when(request()->user('canvas')->isContributor,
                        fn (Builder $query) => $query->where('user_id', request()->user('canvas')->id),
                        fn (Builder $query) => $query)
                    ->with('tags', 'topic')
                    ->find($id);

        if (! $post) {
            $post = new Post(['id' => $id]);
        }

        $post->fill($data);

        $post->user_id = $post->user_id ?? request()->user('canvas')->id;

        $post->save();

        $post->tags()->sync($this->syncTags($request->input('tags', [])));

        $post->topic()->sync($this->syncTopic($request->input('topic', [])));

        return response()->json($post->refresh(), 201);
    }

    /**
     * Display the specified resource.
     *
     * @param $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        $post = Post::query()
                    ->when(request()->user('canvas')->isContributor,
                        fn (Builder $query) => $query->where('user_id', request()->user('canvas')->id),
                        fn (Builder $query) => $query)
                    ->with('tags:name,slug', 'topic:name,slug')
                    ->find($id);

        if ($post) {
            return response()->json([
                'post' => $post,
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
     * @param $id
     * @return mixed
     * @throws Exception
     */
    public function destroy($id)
    {
        $post = Post::query()
                    ->when(request()->user('canvas')->isContributor,
                        fn (Builder $query) => $query->where('user_id', request()->user('canvas')->id),
                        fn (Builder $query) => $query)
                    ->findOrFail($id);

        $post->delete();

        return response()->json(null, 204);
    }

    /**
     * Sync given tags.
     *
     * @param array $incomingTags
     * @return array
     */
    protected function syncTags(array $incomingTags): array
    {
        $tags = Tag::query()->get(['id', 'name', 'slug']);

        return collect($incomingTags)->map(function ($item) use ($tags) {
            $tag = $tags->firstWhere('slug', $item['slug']);

            if (! $tag) {
                $tag = Tag::create([
                    'id' => $id = Uuid::uuid4()->toString(),
                    'name' => $item['name'],
                    'slug' => $item['slug'],
                    'user_id' => request()->user('canvas')->id,
                ]);
            }

            return (string) $tag->id;
        })->toArray();
    }

    /**
     * Sync a given topic.
     *
     * @param array $incomingTopic
     * @return array
     */
    protected function syncTopic(array $incomingTopic): array
    {
        $topics = Topic::query()->get(['id', 'name', 'slug']);

        return collect($incomingTopic)->map(function ($item) use ($topics) {
            $topic = $topics->firstWhere('slug', $item['slug']);

            if (! $topic) {
                $topic = Topic::create([
                    'id' => $id = Uuid::uuid4()->toString(),
                    'name' => $item['name'],
                    'slug' => $item['slug'],
                    'user_id' => request()->user('canvas')->id,
                ]);
            }

            return (string) $topic->id;
        })->toArray();
    }
}
