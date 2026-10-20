<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Models\Post;
use Illuminate\Database\Eloquent\Builder;

final class PostSlug
{
    /**
     * Slug to store for this save.
     *
     * A post keeps the slug it already has, including one shared with another row.
     * A new or edited slug that another post already uses gets the lowest free
     * `-2`, `-3`, … suffix. Existing rows are not renamed.
     */
    public static function forSave(string $slug, ?Post $except = null, int|string|null $ownerId = null): string
    {
        if ($slug === '') {
            return $slug;
        }

        $ignoreId = null;

        if ($except !== null && $except->exists) {
            if ($except->slug === $slug) {
                return $slug;
            }

            $ignoreId = (string) $except->getKey();
            $ownerId = $except->user_id;
        }

        if (! self::taken($slug, $ignoreId, $ownerId)) {
            return $slug;
        }

        for ($suffix = 2; $suffix <= 1000; $suffix++) {
            $candidate = $slug.'-'.$suffix;

            if (! self::taken($candidate, $ignoreId, $ownerId)) {
                return $candidate;
            }
        }

        return $slug.'-1001';
    }

    /**
     * A non-deleted post with this slug blocks it for everyone.
     * A soft-deleted row blocks it only for the same author: the unique index
     * is `(slug, user_id)` and still includes trashed rows, which are not renamed.
     */
    private static function taken(string $slug, ?string $ignoreId, int|string|null $ownerId): bool
    {
        return Post::withTrashed()
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn (Builder $query) => $query->whereKeyNot($ignoreId))
            ->where(function (Builder $query) use ($ownerId): void {
                $query->whereNull('deleted_at');

                if ($ownerId !== null) {
                    $query->orWhere(
                        fn (Builder $query) => $query
                            ->whereNotNull('deleted_at')
                            ->where('user_id', $ownerId),
                    );
                }
            })
            ->exists();
    }
}
