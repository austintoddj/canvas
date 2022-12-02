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
use Illuminate\Routing\Controller;
use Ramsey\Uuid\Uuid;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $isContributor = request()->user('canvas')->isContributor;
        $sortAscending = request()->query('sort', 'desc') === 'asc';
        $filterByAuthor = ! $isContributor && request()->query('author');
        $filterByDraftType = request()->query('type', 'published') === 'draft';

        $posts = Post::query()
                     ->select('id', 'title', 'summary', 'featured_image', 'published_at', 'created_at', 'updated_at')
                     ->when($isContributor, function (Builder $query) {
                         return $query->where('user_id', request()->user('canvas')->id);
                     }, function (Builder $query) {
                         return $query;
                     })
                     ->when($filterByAuthor, function (Builder $query) {
                         return $query->where('user_id', request()->query('author'));
                     }, function (Builder $query) {
                         return $query;
                     })
                     ->when($filterByDraftType, function (Builder $query) {
                         return $query->draft();
                     }, function (Builder $query) {
                         return $query->published();
                     })
                     ->when($sortAscending, function (Builder $query) {
                         return $query->oldest();
                     }, function (Builder $query) {
                         return $query->latest();
                     })
                     ->withCount('views')
                     ->paginate();

        $users = User::query()
                     ->select('id', 'name', 'avatar')
                     ->get()
                     ->toArray();

        return response()->json([
            'posts' => $posts,
            'users' => $users,
            'drafts_count' => $filterByDraftType ? $posts->total() : Post::query()->when($filterByAuthor, function (Builder $query) {
                return $query->where('user_id', request()->user('canvas')->id);
            }, function (Builder $query) {
                return $query;
            })->draft()->count(),
            'published_count' => ! $filterByDraftType ? $posts->total() : Post::query()->when($filterByAuthor, function (Builder $query) {
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
    public function create()
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
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws Exception
     */
    public function store(StorePostRequest $request, string $id)
    {
        $data = $request->validated();

        $post = Post::query()->when(request()->user('canvas')->isContributor, function (Builder $query) {
            return $query->where('user_id', request()->user('canvas')->id);
        }, function (Builder $query) {
            return $query;
        })->with(['tags', 'topic'])->firstOrNew(['id' => $id]);

        $post->fill($data);

        $post->user()->associate($post->user ?? request()->user('canvas'));

        // TODO: Could be in a dedicated Service Class
        if ($incomingTopic = request()->input('topic')) {
            $existingTopic = Topic::query()->firstWhere('slug', $incomingTopic['slug']);

            if (! $existingTopic) {
                $topic = Topic::query()->create([
                    'id' => Uuid::uuid4()->toString(),
                    'name' => $incomingTopic['name'],
                    'slug' => $incomingTopic['slug'],
                    'user_id' => request()->user('canvas')->id,
                ]);

                $post->topic()->associate($topic);
            } else {
                $post->topic()->associate($existingTopic);
            }
        }

        // TODO: Could be in a dedicated Service Class
        $tags = Tag::query()->get(['id', 'name', 'slug']);
        $tagsToSync = collect(request()->input('tags', []))->map(function ($item) use ($tags) {
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
        $post->tags()->sync($tagsToSync);

        $post->save();

        return response()->json($post->refresh(), 201);
    }

    /**
     * Display the specified resource.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        $post = Post::query()->when(request()->user('canvas')->isContributor, function (Builder $query) {
            return $query->where('user_id', request()->user('canvas')->id);
        }, function (Builder $query) {
            return $query;
        })->with(['tags:name,slug', 'topic:name,slug'])->findOrFail($id);

        return response()->json([
            'post' => $post,
            'tags' => Tag::query()->get(['name', 'slug']),
            'topics' => Topic::query()->get(['name', 'slug']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws Exception
     */
    public function destroy(string $id)
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
