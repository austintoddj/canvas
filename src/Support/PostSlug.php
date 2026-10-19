<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Models\Post;
use Illuminate\Database\Eloquent\Builder;

/**
 * Slugs the editor derives from the title.
 *
 * Mirrors `slugify` / `slugFollowsTitle` in resources/js/lib/posts/form.ts.
 * A derived slug that is already taken is stored as `{base}-2`, `{base}-3`, …
 * A slug that does not follow the title is left for the unique rule to reject.
 */
final class PostSlug
{
    public const int MAX_SUFFIX = 50;

    /**
     * Same placeholder `GET /posts/create` mints. Never rewritten.
     */
    private const string GENERATED = '/^post-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    public static function slugify(string $value): string
    {
        $slug = strtolower(trim($value));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
        $slug = trim($slug, '-');

        return $slug === '' ? 'post' : $slug;
    }

    public static function isGenerated(string $slug): bool
    {
        return preg_match(self::GENERATED, $slug) === 1;
    }

    public static function isAutoSuffix(string $slug, string $base): bool
    {
        return preg_match('/^'.preg_quote($base, '/').'-([2-9]|[1-9]\d+)$/', $slug) === 1;
    }

    /**
     * Rewrite a title-derived slug to the post's existing suffix, or the lowest free one.
     * Hand-typed slugs (anything other than the exact slugified title) are returned unchanged.
     */
    public static function disambiguate(?Post $post, ?string $ignoreId, string $slug, string $title): string
    {
        if ($slug === '' || self::isGenerated($slug)) {
            return $slug;
        }

        $base = self::slugify($title);

        if ($slug !== $base) {
            return $slug;
        }

        if ($post instanceof Post && $post->slug === $slug) {
            return $slug;
        }

        if ($post instanceof Post && self::isAutoSuffix($post->slug, $base)) {
            return $post->slug;
        }

        $taken = self::takenSet($base, $ignoreId);

        if (! isset($taken[$slug])) {
            return $slug;
        }

        for ($n = 2; $n <= self::MAX_SUFFIX; $n++) {
            $candidate = $base.'-'.$n;

            if (! isset($taken[$candidate])) {
                return $candidate;
            }
        }

        return $slug;
    }

    /**
     * The per-user unique index still covers soft-deleted rows. Validation ignores
     * them, so rename the owner's trashed row before the slug is written.
     */
    public static function releaseTrashedForUser(string $slug, mixed $userId): void
    {
        if ($slug === '' || ! is_numeric($userId)) {
            return;
        }

        $trashed = Post::onlyTrashed()
            ->where('slug', $slug)
            ->where('user_id', (int) $userId)
            ->first();

        if (! $trashed instanceof Post) {
            return;
        }

        $trashed->slug = 'trashed-'.$trashed->id;
        $trashed->save();
    }

    /**
     * @return array<string, true>
     */
    private static function takenSet(string $base, ?string $ignoreId): array
    {
        $slugs = [$base];

        for ($n = 2; $n <= self::MAX_SUFFIX; $n++) {
            $slugs[] = $base.'-'.$n;
        }

        $found = Post::query()
            ->whereIn('slug', $slugs)
            ->when(
                is_string($ignoreId) && $ignoreId !== '',
                fn (Builder $query) => $query->whereKeyNot($ignoreId),
            )
            ->pluck('slug');

        $taken = [];

        foreach ($found as $slug) {
            if (is_string($slug)) {
                $taken[$slug] = true;
            }
        }

        return $taken;
    }
}
