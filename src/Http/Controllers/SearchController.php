<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Support\AuthorAvatar;
use Canvas\Support\HostUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class SearchController extends Controller
{
    private const RESULTS_PER_TYPE = 10;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user(config('canvas.guard'));
        $query = $request->string('q')->trim()->toString();
        $type = $request->string('type')->trim()->lower()->toString();

        $results = collect();

        if ($type === '' || $type === 'post') {
            $results->push(...$this->searchPosts($user, $query));
        }

        if (Gate::forUser($user)->allows('manage-taxonomy')) {
            if ($type === '' || $type === 'tag') {
                $results->push(...$this->searchTags($query));
            }

            if ($type === '' || $type === 'topic') {
                $results->push(...$this->searchTopics($query));
            }
        }

        if (Gate::forUser($user)->allows('manage-users') && ($type === '' || $type === 'user')) {
            $results->push(...$this->searchUsers($query));
        }

        return response()->json($results->values());
    }

    /**
     * @return list<array{id: string, title: string, type: string, route: string}>
     */
    private function searchPosts(mixed $user, string $query): array
    {
        $canViewAll = Gate::forUser($user)->allows('viewAll', Post::class);

        return Post::query()
            ->select('id', 'title')
            ->when(! $canViewAll, fn (Builder $q) => $q->where('user_id', data_get($user, 'id')))
            ->when($query !== '', fn (Builder $q) => $q->where('title', 'like', "%{$query}%"))
            ->latest()
            ->limit(self::RESULTS_PER_TYPE)
            ->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'type' => 'Post',
                'route' => 'edit-post',
            ])
            ->all();
    }

    /**
     * @return list<array{id: string, name: string, type: string, route: string}>
     */
    private function searchTags(string $query): array
    {
        return Tag::query()
            ->select('id', 'name')
            ->when($query !== '', fn (Builder $q) => $q->where('name', 'like', "%{$query}%"))
            ->latest()
            ->limit(self::RESULTS_PER_TYPE)
            ->get()
            ->map(fn (Tag $tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'type' => 'Tag',
                'route' => 'edit-tag',
            ])
            ->all();
    }

    /**
     * @return list<array{id: string, name: string, type: string, route: string}>
     */
    private function searchTopics(string $query): array
    {
        return Topic::query()
            ->select('id', 'name')
            ->when($query !== '', fn (Builder $q) => $q->where('name', 'like', "%{$query}%"))
            ->latest()
            ->limit(self::RESULTS_PER_TYPE)
            ->get()
            ->map(fn (Topic $topic) => [
                'id' => $topic->id,
                'name' => $topic->name,
                'type' => 'Topic',
                'route' => 'edit-topic',
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, name: mixed, email: mixed, username: string|null, avatar_url: string, type: string, route: string}>
     */
    private function searchUsers(string $query): array
    {
        return CanvasUser::query()
            ->with('user')
            ->latest('user_id')
            // Host accessors may combine arbitrary columns, so match names after hydration.
            ->lazy($query === '' ? self::RESULTS_PER_TYPE : 100)
            ->filter(fn (CanvasUser $canvasUser): bool => $query === ''
                || Str::contains(HostUser::name($canvasUser->user) ?? '', $query, ignoreCase: true)
                || Str::contains($canvasUser->username ?? '', $query, ignoreCase: true))
            ->take(self::RESULTS_PER_TYPE)
            ->map(fn (CanvasUser $canvasUser) => [
                'id' => $canvasUser->user_id,
                'name' => HostUser::name($canvasUser->user),
                'email' => data_get($canvasUser->user, 'email'),
                'username' => $canvasUser->username,
                'avatar_url' => AuthorAvatar::url($canvasUser->avatar),
                'type' => 'User',
                'route' => 'edit-user',
            ])
            ->values()
            ->all();
    }
}
