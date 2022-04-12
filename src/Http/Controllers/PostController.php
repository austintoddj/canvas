<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\StorePostRequest;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\User;
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
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(): JsonResponse
    {
        $isContributor = request()->user('canvas')->isContributor;
        $scopeToAuthor = ! $isContributor && request()->query('author');
        $wantsDrafts = request()->query('type', 'published') == 'draft';

        $posts = Post::query()
                     ->select('id', 'title', 'summary', 'featured_image', 'published_at', 'created_at', 'updated_at')
                     ->when($isContributor, function (Builder $query) {
                         return $query->where('user_id', request()->user('canvas')->id);
                     }, function (Builder $query) {
                         return $query;
                     })
                     ->when($scopeToAuthor, function (Builder $query) {
                         return $query->where('user_id', request()->query('author'));
                     }, function (Builder $query) {
                         return $query;
                     })
                     ->when($wantsDrafts, function (Builder $query) {
                         return $query->draft();
                     }, function (Builder $query) {
                         return $query->published();
                     })
                     ->latest()
                     ->withCount('views')
                     ->paginate();

        $users = User::query()
                    ->select('id', 'name', 'avatar')
                    ->get()
                    ->toArray();

        return response()->json([
            'posts' => $posts,
            'users' => $users,
            'drafts_count' => $wantsDrafts ? $posts->total() : Post::query()->when($scopeToAuthor, function (Builder $query) {
                return $query->where('user_id', request()->user('canvas')->id);
            }, function (Builder $query) {
                return $query;
            })->draft()->count(),
            'published_count' => ! $wantsDrafts ? $posts->total() : Post::query()->when($scopeToAuthor, function (Builder $query) {
                return $query->where('user_id', request()->user('canvas')->id);
            }, function (Builder $query) {
                return $query;
            })->published()->count(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function create(): JsonResponse
    {
        $uuid = Uuid::uuid4();

        return response()->json([
            'post' => Post::query()->make([
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
     * @param  \Canvas\Http\Requests\StorePostRequest  $request
     * @param $id
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws Exception
     */
    public function store(StorePostRequest $request, $id): JsonResponse
    {
        $data = $request->validated();

        $post = Post::query()->when($request->user('canvas')->isContributor, function (Builder $query) {
            return $query->where('user_id', request()->user('canvas')->id);
        }, function (Builder $query) {
            return $query;
        })->with('tags', 'topic')->find($id);

        if ($request->user('canvas')->isContributor &&
            $request->user('canvas')->id != optional($post)->user_id) {
            abort(403);
        }

        if (! $post) {
            $post = new Post(['id' => $id]);
        }

        $post->fill($data);

        $post->user_id = $post->user_id ?? request()->user('canvas')->id;

        $post->save();

        $tags = Tag::query()->get(['id', 'name', 'slug']);
        $topics = Topic::query()->get(['id', 'name', 'slug']);

        $tagsToSync = collect($request->input('tags', []))->map(function ($item) use ($tags) {
            $tag = $tags->firstWhere('slug', $item['slug']);

            if (! $tag) {
                $tag = Tag::query()->create([
                    'id' => Uuid::uuid4()->toString(),
                    'name' => $item['name'],
                    'slug' => $item['slug'],
                    'user_id' => request()->user('canvas')->id,
                ]);
            }

            return (string) $tag->id;
        })->toArray();

        $topicToSync = collect($request->input('topic', []))->map(function ($item) use ($topics) {
            $topic = $topics->firstWhere('slug', $item['slug']);

            if (! $topic) {
                $topic = Topic::query()->create([
                    'id' => Uuid::uuid4()->toString(),
                    'name' => $item['name'],
                    'slug' => $item['slug'],
                    'user_id' => request()->user('canvas')->id,
                ]);
            }

            return (string) $topic->id;
        })->toArray();

        $post->tags()->sync($tagsToSync);

        $post->topic()->sync($topicToSync);

        return response()->json($post->refresh(), 201);
    }

    /**
     * Display the specified resource.
     *
     * @param $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id): JsonResponse
    {
        $post = Post::query()->when(request()->user('canvas')->isContributor, function (Builder $query) {
            return $query->where('user_id', request()->user('canvas')->id);
        }, function (Builder $query) {
            return $query;
        })->with('tags:name,slug', 'topic:name,slug')->findOrFail($id);

        return response()->json([
            'post' => $post,
            'tags' => Tag::query()->get(['name', 'slug']),
            'topics' => Topic::query()->get(['name', 'slug']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param $id
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws Exception
     */
    public function destroy($id): JsonResponse
    {
        $post = Post::query()->when(request()->user('canvas')->isContributor, function (Builder $query) {
            return $query->where('user_id', request()->user('canvas')->id);
        }, function (Builder $query) {
            return $query;
        })->findOrFail($id);

        $post->delete();

        return response()->json(null, 204);
    }
}
