<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Analytics\PostInsights;
use Canvas\Http\Requests\PostRequest;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $user = request()->user(config('canvas.guard'));
        $canViewAllPosts = Gate::forUser($user)->allows('viewAll', Post::class);

        $baseQuery = $this->visiblePostsQuery($user, $canViewAllPosts);

        $posts = (clone $baseQuery)
            ->select('id', 'title', 'summary', 'featured_image', 'published_at', 'created_at', 'updated_at')
            ->when(
                request()->query('type') === 'draft',
                fn (Builder $query) => $query->draft(),
                fn (Builder $query) => $query->published(),
            )
            ->latest()
            ->withCount('views')
            ->paginate();

        $counts = $this->draftAndPublishedCounts($baseQuery);

        return response()->json([
            'posts' => $posts,
            'draftCount' => $counts['draft'],
            'publishedCount' => $counts['published'],
        ], 200);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): JsonResponse
    {
        $uuid = Str::uuid();

        return response()->json([
            'post' => Post::query()->make([
                'id' => $uuid->toString(),
                'slug' => "post-{$uuid->toString()}",
            ]),
            'tags' => Tag::query()->get(['name', 'slug']),
            'topics' => Topic::query()->get(['name', 'slug']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * Live (published) posts keep a stable public snapshot: ordinary saves write
     * `pending` only. Pass `promote: true` (or unpublish) to mutate live fields.
     *
     * @throws Exception
     */
    public function store(PostRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $promote = (bool) ($data['promote'] ?? false);
        unset($data['promote']);

        $user = request()->user(config('canvas.guard'));

        $post = Post::query()->with('tags', 'topic')->find($id);
        $created = $post === null;

        if ($post && Gate::forUser($user)->denies('update', $post)) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$post->getKey()]);
        }

        $post ??= new Post(['id' => $id]);

        $tagsInput = $request->input('tags', []);
        $topicInput = $request->input('topic', []);
        $tagsInput = is_array($tagsInput) ? $tagsInput : [];
        $topicInput = is_array($topicInput) ? $topicInput : [];

        if ($this->shouldWritePendingOnly($post, $data, $promote)) {
            $post->writePending($data, $tagsInput, $topicInput);

            return response()->json($post->refresh()->load('tags:name,slug', 'topic:id,name,slug'), 200);
        }

        $post->fill($data);
        $post->user_id ??= data_get($user, 'id');
        $post->clearPending();

        $allowTaxonomyCreate = $post->published_at !== null;

        $post->topic_id = $this->resolveTopicId($topicInput, $user, $allowTaxonomyCreate);
        $post->save();

        $post->tags()->sync($this->resolveTagsForSync($tagsInput, $user, $allowTaxonomyCreate));

        return response()->json($post->refresh()->load('tags:name,slug', 'topic:id,name,slug'), $created ? 201 : 200);
    }

    /**
     * Drop unpublished changes and restore the public snapshot in the editor.
     */
    public function discard(Post $post): JsonResponse
    {
        $this->ensurePostIsVisibleToCurrentUser($post);

        if (Gate::forUser(request()->user(config('canvas.guard')))->denies('update', $post)) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$post->getKey()]);
        }

        $post->clearPending();
        $post->save();

        $post->loadMissing('tags:name,slug', 'topic:id,name,slug');

        return response()->json($post->refresh());
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post): JsonResponse
    {
        $this->ensurePostIsVisibleToCurrentUser($post);

        $post->loadMissing('tags:name,slug', 'topic:id,name,slug');

        return response()->json([
            'post' => $post,
            'tags' => Tag::query()->get(['name', 'slug']),
            'topics' => Topic::query()->get(['name', 'slug']),
        ]);
    }

    /**
     * Display stats for the specified resource.
     */
    public function stats(Post $post): JsonResponse
    {
        $this->ensurePostIsVisibleToCurrentUser($post);

        if (! $post->published) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$post->getKey()]);
        }

        $locale = data_get(request()->user(config('canvas.guard')), 'locale');

        return response()->json(
            PostInsights::for($post, is_string($locale) ? $locale : null)
        );
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return mixed
     *
     * @throws Exception
     */
    public function destroy(Post $post)
    {
        $this->ensurePostIsVisibleToCurrentUser($post);

        $post->delete();

        return response()->json(null, 204);
    }

    private function ensurePostIsVisibleToCurrentUser(Post $post): void
    {
        if (Gate::forUser(request()->user(config('canvas.guard')))->denies('view', $post)) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$post->getKey()]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function shouldWritePendingOnly(Post $post, array $data, bool $promote): bool
    {
        if ($promote || ! $post->exists || ! $post->published) {
            return false;
        }

        $nextPublishedAt = array_key_exists('published_at', $data) ? $data['published_at'] : $post->published_at;

        return $nextPublishedAt !== null && $nextPublishedAt !== '';
    }

    /**
     * @return Builder<Post>
     */
    private function visiblePostsQuery(mixed $user, bool $canViewAll): Builder
    {
        return Post::query()->when(
            ! $canViewAll || request()->query('scope', 'user') !== 'all',
            fn (Builder $query) => $query->where('user_id', data_get($user, 'id'))
        );
    }

    /**
     * @param  Builder<Post>  $baseQuery
     * @return array{draft: int, published: int}
     */
    private function draftAndPublishedCounts(Builder $baseQuery): array
    {
        $now = now()->toDateTimeString();

        $counts = (clone $baseQuery)
            ->reorder()
            ->toBase()
            ->selectRaw(
                'SUM(CASE WHEN published_at IS NULL OR published_at > ? THEN 1 ELSE 0 END) as draft_count,
                 SUM(CASE WHEN published_at IS NOT NULL AND published_at <= ? THEN 1 ELSE 0 END) as published_count',
                [$now, $now],
            )
            ->first();

        return [
            'draft' => (int) ($counts->draft_count ?? 0),
            'published' => (int) ($counts->published_count ?? 0),
        ];
    }

    /**
     * Resolve tag IDs for sync. Unknown slugs create rows only when publishing.
     *
     * @param  array<int, array{name: string, slug: string}>  $tagInputs
     * @return list<string>
     */
    private function resolveTagsForSync(array $tagInputs, mixed $user, bool $allowCreate): array
    {
        $existing = Tag::query()->get(['id', 'name', 'slug']);

        return collect($tagInputs)
            ->map(function (array $item) use ($existing, $user, $allowCreate): ?string {
                $match = $existing->firstWhere('slug', $item['slug']);

                if ($match !== null) {
                    return (string) $match->id;
                }

                if (! $allowCreate) {
                    return null;
                }

                $created = Tag::query()->create([
                    'id' => (string) Str::uuid(),
                    'name' => $item['name'],
                    'slug' => $item['slug'],
                    'user_id' => data_get($user, 'id'),
                ]);

                $existing->push($created);

                return (string) $created->id;
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Resolve a topic ID. Unknown slugs create a row only when publishing.
     *
     * @param  array<int, array{name: string, slug: string}>  $topicInput
     */
    private function resolveTopicId(array $topicInput, mixed $user, bool $allowCreate): ?string
    {
        $input = collect($topicInput)->first();

        if (! $input) {
            return null;
        }

        $match = Topic::query()->firstWhere('slug', $input['slug']);

        if ($match !== null) {
            return (string) $match->id;
        }

        if (! $allowCreate) {
            return null;
        }

        return (string) Topic::query()->create([
            'id' => (string) Str::uuid(),
            'name' => $input['name'],
            'slug' => $input['slug'],
            'user_id' => data_get($user, 'id'),
        ])->id;
    }
}
