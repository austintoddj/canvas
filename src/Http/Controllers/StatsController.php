<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Analytics\DashboardInsights;
use Canvas\Analytics\Period;
use Canvas\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Gate;

class StatsController extends Controller
{
    private const PIPELINE_LIMIT = 3;

    /** @var list<int> */
    private const ALLOWED_DAYS = [7, 30, 90, 365];

    /**
     * Display a listing of the resource.
     */
    public function __invoke(): JsonResponse
    {
        $user = request()->user(config('canvas.guard'));
        $canViewAllPosts = Gate::forUser($user)->allows('viewAll', Post::class);
        $scopeAll = request()->query('scope', 'user') === 'all' && $canViewAllPosts;
        $days = $this->resolveDays();

        $baseQuery = Post::query()->when(
            ! $scopeAll,
            fn (Builder $query) => $query->where('user_id', data_get($user, 'id'))
        );

        $publishedIds = (clone $baseQuery)->published()->pluck('id');
        $locale = is_string(data_get($user, 'locale')) ? data_get($user, 'locale') : null;

        return response()->json([
            ...DashboardInsights::for($publishedIds, $days, $locale)->jsonSerialize(),
            'days' => $days,
            'library' => $this->libraryCounts($baseQuery),
            'pipeline' => $this->pipeline($baseQuery),
            'recent_posts' => $this->recentPosts($baseQuery),
            'top_posts' => $this->topPosts($baseQuery, $days),
        ]);
    }

    private function resolveDays(): int
    {
        $days = (int) request()->query('days', 30);

        return in_array($days, self::ALLOWED_DAYS, true) ? $days : 30;
    }

    /**
     * @param  Builder<Post>  $baseQuery
     * @return array{published: int, drafts: int, scheduled: int, pending_updates: int}
     */
    private function libraryCounts(Builder $baseQuery): array
    {
        $now = now()->toDateTimeString();

        $counts = (clone $baseQuery)
            ->reorder()
            ->toBase()
            ->selectRaw(
                'SUM(CASE WHEN published_at IS NOT NULL AND published_at <= ? THEN 1 ELSE 0 END) as published_count,
                 SUM(CASE WHEN published_at IS NULL THEN 1 ELSE 0 END) as draft_count,
                 SUM(CASE WHEN published_at IS NOT NULL AND published_at > ? THEN 1 ELSE 0 END) as scheduled_count,
                 SUM(CASE WHEN pending IS NOT NULL THEN 1 ELSE 0 END) as pending_count',
                [$now, $now],
            )
            ->first();

        return [
            'published' => (int) ($counts->published_count ?? 0),
            'drafts' => (int) ($counts->draft_count ?? 0),
            'scheduled' => (int) ($counts->scheduled_count ?? 0),
            'pending_updates' => (int) ($counts->pending_count ?? 0),
        ];
    }

    /**
     * @param  Builder<Post>  $baseQuery
     * @return array{
     *     drafts: list<array{id: string, title: string, published_at: mixed, updated_at: mixed}>,
     *     scheduled: list<array{id: string, title: string, published_at: mixed, updated_at: mixed}>,
     *     pending: list<array{id: string, title: string, published_at: mixed, updated_at: mixed}>
     * }
     */
    private function pipeline(Builder $baseQuery): array
    {
        $now = now();

        return [
            'drafts' => $this->mapPipelinePosts(
                (clone $baseQuery)
                    ->select('id', 'title', 'published_at', 'updated_at')
                    ->whereNull('published_at')
                    ->latest('updated_at')
                    ->limit(self::PIPELINE_LIMIT)
                    ->get()
            ),
            'scheduled' => $this->mapPipelinePosts(
                (clone $baseQuery)
                    ->select('id', 'title', 'published_at', 'updated_at')
                    ->whereNotNull('published_at')
                    ->where('published_at', '>', $now)
                    ->orderBy('published_at')
                    ->limit(self::PIPELINE_LIMIT)
                    ->get()
            ),
            'pending' => $this->mapPipelinePosts(
                (clone $baseQuery)
                    ->select('id', 'title', 'published_at', 'updated_at')
                    ->whereNotNull('pending')
                    ->latest('updated_at')
                    ->limit(self::PIPELINE_LIMIT)
                    ->get()
            ),
        ];
    }

    /**
     * @param  Collection<int, Post>  $posts
     * @return list<array{id: string, title: string, published_at: mixed, updated_at: mixed}>
     */
    private function mapPipelinePosts(Collection $posts): array
    {
        return $posts
            ->map(static fn (Post $post): array => [
                'id' => (string) $post->id,
                'title' => (string) $post->title,
                'published_at' => $post->published_at,
                'updated_at' => $post->updated_at,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Builder<Post>  $baseQuery
     * @return list<array{
     *     id: string,
     *     title: string,
     *     summary: string|null,
     *     featured_image: string|null,
     *     published_at: mixed,
     *     created_at: mixed,
     *     updated_at: mixed,
     *     views_count: int,
     *     has_pending_changes: bool
     * }>
     */
    private function recentPosts(Builder $baseQuery): array
    {
        /** @var Collection<int, Post> $posts */
        $posts = (clone $baseQuery)
            ->select('id', 'title', 'summary', 'featured_image', 'published_at', 'created_at', 'updated_at', 'pending')
            ->withCount('views')
            ->latest('updated_at')
            ->limit(8)
            ->get();

        return $posts
            ->map(static fn (Post $post): array => [
                'id' => (string) $post->id,
                'title' => (string) $post->title,
                'summary' => $post->summary,
                'featured_image' => $post->featured_image,
                'published_at' => $post->published_at,
                'created_at' => $post->created_at,
                'updated_at' => $post->updated_at,
                'views_count' => (int) $post->views_count,
                'has_pending_changes' => $post->has_pending_changes,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Builder<Post>  $baseQuery
     * @return list<array{id: string, title: string, views: int}>
     */
    private function topPosts(Builder $baseQuery, int $days = 30, int $limit = 8): array
    {
        $period = Period::days($days);

        /** @var Collection<int, Post> $posts */
        $posts = (clone $baseQuery)
            ->published()
            ->select('id', 'title')
            ->withCount([
                'views' => fn (Builder $query) => $query->whereBetween('created_at', [
                    $period->start,
                    $period->end,
                ]),
            ])
            ->orderByDesc('views_count')
            ->limit($limit)
            ->get()
            ->filter(static fn (Post $post): bool => (int) $post->views_count > 0)
            ->values();

        return $posts
            ->map(static fn (Post $post): array => [
                'id' => (string) $post->id,
                'title' => (string) $post->title,
                'views' => (int) $post->views_count,
            ])
            ->all();
    }
}
