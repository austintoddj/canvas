<?php

declare(strict_types=1);

namespace Canvas\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Symfony\Component\HttpFoundation\Response;

class Session
{
    public function handle(Request $request, Closure $next): Response
    {
        if (session()->has('viewed_posts')) {
            /** @var array<string|int, int|string> $viewedPosts */
            $viewedPosts = session()->get('viewed_posts', []);

            $stale = collect($viewedPosts)
                ->filter(fn (int|string $timestamp): bool => (int) $timestamp < now()->subHour()->timestamp)
                ->keys()
                ->map(fn (string|int $id): string => "viewed_posts.{$id}")
                ->all();

            session()->forget($stale);
        }

        if (session()->has('visited_posts')) {
            /** @var array<string|int, array{timestamp: int|string}> $visitedPosts */
            $visitedPosts = session()->get('visited_posts', []);

            $stale = collect($visitedPosts)
                ->filter(fn (array $item): bool => ! Date::createFromTimestamp((int) $item['timestamp'])->isToday())
                ->keys()
                ->map(fn (string|int $id): string => "visited_posts.{$id}")
                ->all();

            session()->forget($stale);
        }

        return $next($request);
    }
}
