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
use Ramsey\Uuid\Uuid;

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

        return response()->json([
            'posts' => $posts,
            'draftCount' => (clone $baseQuery)->draft()->count(),
            'publishedCount' => (clone $baseQuery)->published()->count(),
        ], 200);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): JsonResponse
    {
        $uuid = Uuid::uuid4();

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
     * @throws Exception
     */
    public function store(PostRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $user = request()->user(config('canvas.guard'));

        $post = Post::query()->with('tags', 'topic')->find($id);

        if ($post && Gate::forUser($user)->denies('update', $post)) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$post->getKey()]);
        }

        $post ??= new Post(['id' => $id]);

        $post->fill($data);
        $post->user_id ??= $user->id;
        $post->topic_id = $this->resolveTopicId($request->input('topic', []), $user);
        $post->save();

        $post->tags()->sync($this->resolveTagsForSync($request->input('tags', []), $user));

        return response()->json($post->refresh(), 201);
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

        return response()->json(
            PostInsights::for($post, request()->user(config('canvas.guard'))?->locale)
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

    private function visiblePostsQuery(mixed $user, bool $canViewAll): Builder
    {
        return Post::query()->when(
            ! $canViewAll || request()->query('scope', 'user') !== 'all',
            fn (Builder $query) => $query->where('user_id', $user->id)
        );
    }

    /**
     * Find or create tags from the given input and return their IDs for sync.
     */
    private function resolveTagsForSync(array $tagInputs, mixed $user): array
    {
        $existing = Tag::query()->get(['id', 'name', 'slug']);

        return collect($tagInputs)->map(function (array $item) use ($existing, $user): string {
            return (string) ($existing->firstWhere('slug', $item['slug']) ?? Tag::create([
                'id' => Uuid::uuid4()->toString(),
                'name' => $item['name'],
                'slug' => $item['slug'],
                'user_id' => $user->id,
            ]))->id;
        })->toArray();
    }

    /**
     * Find or create a topic from the given input and return its ID, or null.
     */
    private function resolveTopicId(array $topicInput, mixed $user): ?string
    {
        $input = collect($topicInput)->first();

        if (! $input) {
            return null;
        }

        return (string) (Topic::query()->firstWhere('slug', $input['slug']) ?? Topic::create([
            'id' => Uuid::uuid4()->toString(),
            'name' => $input['name'],
            'slug' => $input['slug'],
            'user_id' => $user->id,
        ]))->id;
    }
}
