<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Enums\RevisionReason;
use Canvas\Http\Requests\RenamePostRevisionRequest;
use Canvas\Http\Requests\StorePostRevisionRequest;
use Canvas\Models\Post;
use Canvas\Models\PostRevision;
use Canvas\Support\PostAuthor;
use Canvas\Support\RecordPostRevision;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

class PostRevisionController extends Controller
{
    /** @var list<string> */
    private const LEAN_COLUMNS = [
        'id',
        'post_id',
        'user_id',
        'label',
        'title',
        'created_at',
        'updated_at',
    ];

    public function index(Post $post): JsonResponse
    {
        $this->ensurePostIsVisibleToCurrentUser($post);

        $revisions = $post->revisions()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(self::LEAN_COLUMNS);

        $authors = PostAuthor::mapByUserIds($revisions->pluck('user_id')->all());

        return response()->json([
            'revisions' => $revisions
                ->map(fn (PostRevision $revision): array => $this->leanRevisionPayload($revision, $authors))
                ->values()
                ->all(),
        ]);
    }

    public function show(Post $post, PostRevision $revision): JsonResponse
    {
        $this->ensureRevisionBelongsToPost($post, $revision);
        $this->ensurePostIsVisibleToCurrentUser($post);

        return response()->json([
            'revision' => $this->fullRevisionPayload($revision),
        ]);
    }

    public function store(StorePostRevisionRequest $request, Post $post): JsonResponse
    {
        $this->ensurePostIsVisibleToCurrentUser($post);
        $this->ensurePostIsUpdatableByCurrentUser($post);

        $label = $request->validated('label');
        $user = request()->user(config('canvas.guard'));
        $userId = data_get($user, 'id');
        $userId = is_int($userId) || is_numeric($userId) ? (int) $userId : null;

        $revision = RecordPostRevision::fromPost(
            $post,
            $userId,
            RevisionReason::Left,
            is_string($label) && $label !== '' ? $label : null,
        );

        if ($revision === null) {
            return response()->json([
                'message' => trans('canvas::app.editor.history_save_empty'),
                'code' => 'revision_empty',
            ], 422);
        }

        return response()->json([
            'revision' => $this->fullRevisionPayload($revision),
        ], 201);
    }

    public function update(RenamePostRevisionRequest $request, Post $post, PostRevision $revision): JsonResponse
    {
        $this->ensureRevisionBelongsToPost($post, $revision);
        $this->ensurePostIsVisibleToCurrentUser($post);
        $this->ensurePostIsUpdatableByCurrentUser($post);

        $label = $request->validated('label');
        $revision->label = is_string($label) && $label !== '' ? $label : null;
        $revision->save();

        $fresh = $revision->refresh();
        $authors = PostAuthor::mapByUserIds(
            is_int($fresh->user_id) ? [$fresh->user_id] : []
        );

        return response()->json([
            'revision' => $this->leanRevisionPayload($fresh, $authors),
        ]);
    }

    /**
     * Apply a revision's content into the editor/post state (pending for live posts).
     *
     * @throws Exception
     */
    public function restore(Post $post, PostRevision $revision): JsonResponse
    {
        $this->ensureRevisionBelongsToPost($post, $revision);
        $this->ensurePostIsVisibleToCurrentUser($post);
        $this->ensurePostIsUpdatableByCurrentUser($post);

        $data = [
            'title' => $revision->title,
            'slug' => $revision->slug ?? $post->slug,
            'summary' => $revision->summary,
            'body' => $revision->body,
            'featured_image' => $revision->featured_image,
            'featured_image_caption' => $revision->featured_image_caption,
            'meta' => $revision->meta,
        ];

        $post->loadMissing(['tags:name,slug', 'topic:id,name,slug']);

        $tags = $post->tags
            ->map(static fn ($tag): array => [
                'name' => (string) $tag->name,
                'slug' => (string) $tag->slug,
            ])
            ->values()
            ->all();

        $topic = $post->topic !== null
            ? [[
                'name' => (string) $post->topic->name,
                'slug' => (string) $post->topic->slug,
            ]]
            : [];

        if ($post->published) {
            $post->writePending($data, $tags, $topic);
        } else {
            $post->fill($data);
            $post->clearPending();
            $post->save();
        }

        $post = $post->refresh();

        $user = request()->user(config('canvas.guard'));
        $userId = data_get($user, 'id');
        $userId = is_int($userId) || is_numeric($userId) ? (int) $userId : null;

        RecordPostRevision::fromPost(
            $post,
            $userId,
            RevisionReason::Restored,
        );

        return response()->json($this->postPayload($post));
    }

    private function ensureRevisionBelongsToPost(Post $post, PostRevision $revision): void
    {
        if ($revision->post_id !== $post->getKey()) {
            throw (new ModelNotFoundException)->setModel(PostRevision::class, [$revision->getKey()]);
        }
    }

    private function ensurePostIsVisibleToCurrentUser(Post $post): void
    {
        if (Gate::forUser(request()->user(config('canvas.guard')))->denies('view', $post)) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$post->getKey()]);
        }
    }

    private function ensurePostIsUpdatableByCurrentUser(Post $post): void
    {
        if (Gate::forUser(request()->user(config('canvas.guard')))->denies('update', $post)) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$post->getKey()]);
        }
    }

    /**
     * @param  array<int, array{id: int|string, name: string|null, username: string|null, avatar_url: string|null}>  $authors
     * @return array<string, mixed>
     */
    private function leanRevisionPayload(PostRevision $revision, array $authors = []): array
    {
        $payload = $revision->only(self::LEAN_COLUMNS);
        $userId = $revision->user_id;
        $payload['user'] = is_int($userId) ? ($authors[$userId] ?? PostAuthor::forUserId($userId)) : null;

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function fullRevisionPayload(PostRevision $revision): array
    {
        $payload = $revision->toArray();
        $payload['user'] = PostAuthor::forUserId(
            is_int($revision->user_id) ? $revision->user_id : null
        );

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function postPayload(Post $post): array
    {
        $post->loadMissing('tags:name,slug', 'topic:id,name,slug', 'user');
        $author = PostAuthor::for($post);
        $post->unsetRelation('user');

        $payload = $post->toArray();
        $payload['user'] = $author;

        return $payload;
    }
}
