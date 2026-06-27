<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

class SearchController extends Controller
{
    private const RESULTS_PER_TYPE = 10;

    /**
     * Search all accessible content types for the command palette.
     *
     * TODO: Introduce caching
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user(config('canvas.guard'));
        $query = $request->string('q')->trim()->toString();

        $results = collect();

        $results->push(...$this->searchPosts($user, $query));

        if (Gate::forUser($user)->allows('manage-taxonomy')) {
            $results->push(...$this->searchTags($query));
            $results->push(...$this->searchTopics($query));
        }

        if (Gate::forUser($user)->allows('manage-users')) {
            $results->push(...$this->searchUsers($query));
        }

        return response()->json($results->values());
    }

    private function searchPosts(mixed $user, string $query): array
    {
        $canViewAll = Gate::forUser($user)->allows('viewAll', Post::class);

        return Post::query()
            ->select('id', 'title')
            ->when(! $canViewAll, fn (Builder $q) => $q->where('user_id', $user->id))
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

    private function searchUsers(string $query): array
    {
        $userModel = config('canvas.user_model');

        return $userModel::query()
            ->select('id', 'name', 'email')
            ->when($query !== '', fn (Builder $q) => $q->where('name', 'like', "%{$query}%"))
            ->latest()
            ->limit(self::RESULTS_PER_TYPE)
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'type' => 'User',
                'route' => 'edit-user',
            ])
            ->all();
    }
}
