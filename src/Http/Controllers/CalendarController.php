<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Support\PostAuthor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class CalendarController extends Controller
{
    /** Month grids with padding stay under ~42 days; leave headroom for client range. */
    private const MAX_RANGE_DAYS = 92;

    public function __invoke(): JsonResponse
    {
        $user = request()->user(config('canvas.guard'));
        $canViewAllPosts = Gate::forUser($user)->allows('viewAll', Post::class);
        $scopeAll = request()->query('scope', 'user') === 'all' && $canViewAllPosts;

        [$from, $to] = $this->resolveRange();

        /** @var Collection<int, Post> $posts */
        $posts = Post::query()
            ->select('id', 'title', 'slug', 'published_at', 'featured_image', 'user_id')
            ->whereNotNull('published_at')
            ->whereBetween('published_at', [$from, $to])
            ->when(
                ! $scopeAll,
                fn (Builder $query) => $query->where('user_id', data_get($user, 'id'))
            )
            ->orderBy('published_at')
            ->get();

        /** @var list<int|null> $userIds */
        $userIds = $posts
            ->pluck('user_id')
            ->map(static fn (mixed $id): ?int => is_numeric($id) ? (int) $id : null)
            ->all();

        $authors = PostAuthor::mapByUserIds($userIds);
        $now = now();

        $payload = $posts
            ->map(static function (Post $post) use ($authors, $now): array {
                $userId = is_numeric($post->user_id) ? (int) $post->user_id : null;
                $publishedAt = $post->published_at;
                $status = $publishedAt !== null && $publishedAt->greaterThan($now)
                    ? 'scheduled'
                    : 'published';

                return [
                    'id' => (string) $post->id,
                    'title' => $post->title,
                    'slug' => (string) $post->slug,
                    'published_at' => $publishedAt,
                    'featured_image' => $post->featured_image,
                    'status' => $status,
                    'user' => $userId !== null ? ($authors[$userId] ?? null) : null,
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'posts' => $payload,
        ]);
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveRange(): array
    {
        $fromRaw = request()->query('from');
        $toRaw = request()->query('to');

        if (! is_string($fromRaw) || ! is_string($toRaw) || $fromRaw === '' || $toRaw === '') {
            throw ValidationException::withMessages([
                'from' => ['The from and to query parameters are required (Y-m-d).'],
            ]);
        }

        $from = $this->parseDate($fromRaw, 'from')?->startOfDay();
        $to = $this->parseDate($toRaw, 'to')?->endOfDay();

        if ($from === null || $to === null) {
            throw ValidationException::withMessages([
                'from' => ['The from and to query parameters must be valid Y-m-d dates.'],
            ]);
        }

        if ($to->lt($from)) {
            throw ValidationException::withMessages([
                'to' => ['The to date must be on or after from.'],
            ]);
        }

        if ($from->diffInDays($to) > self::MAX_RANGE_DAYS) {
            throw ValidationException::withMessages([
                'to' => ['The date range may not exceed '.self::MAX_RANGE_DAYS.' days.'],
            ]);
        }

        return [$from, $to];
    }

    private function parseDate(string $value, string $field): ?Carbon
    {
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            throw ValidationException::withMessages([
                $field => ['The '.$field.' query parameter must be a valid Y-m-d date.'],
            ]);
        }

        try {
            $date = Carbon::createFromFormat('Y-m-d', $value, (string) config('app.timezone'));
        } catch (\Throwable) {
            return null;
        }

        if (! $date instanceof Carbon || $date->format('Y-m-d') !== $value) {
            return null;
        }

        return $date;
    }
}
