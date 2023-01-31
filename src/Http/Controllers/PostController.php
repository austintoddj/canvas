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
     * Store a newly created resource in storage.
     *
     * @param  StorePostRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StorePostRequest $request)
    {
        $post = Post::query()->create([
            'id' => Uuid::uuid4()->toString(),
            ...$request->validated(),
        ]);

        $post->user()->associate($request->user('canvas'));

        $post->tags()->sync($this->tagsToSync($request->input('tags', [])));

        return response()->json($post->refresh());
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
     * Update the specified resource in storage.
     *
     * @param  \Canvas\Http\Requests\StorePostRequest  $request
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws Exception
     */
    public function update(StorePostRequest $request, string $id)
    {
        $data = $request->validated();

        $post = Post::query()->when(request()->user('canvas')->isContributor, function (Builder $query) {
            return $query->where('user_id', request()->user('canvas')->id);
        }, function (Builder $query) {
            return $query;
        })->with(['tags', 'topic'])->findOrFail($id);

        $post->update($data);

        $post->user()->associate($post->user ?? $request->user('canvas'));

        $post->tags()->sync($this->tagsToSync($request->input('tags', [])));

        return response()->json($post->refresh());
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

    /**
     * Find or create the tags to sync.
     *
     * @param  array  $incomingTags
     * @return array
     */
    private function tagsToSync(array $incomingTags = []): array
    {
        $tags = Tag::query()->get(['id', 'name', 'slug']);

        return collect($incomingTags)->map(function ($item) use ($tags) {
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
    }
}
