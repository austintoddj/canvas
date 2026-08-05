<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Models\Post;
use Canvas\Models\PostRevision;

/**
 * Tip-of-history summary for editor chrome (last-edit tooltip + unseen badge).
 */
final class PostLastRevision
{
    /**
     * Newest checkpoint for a post, with display-only actor.
     *
     * @return array{
     *     id: string,
     *     user_id: int|null,
     *     created_at: mixed,
     *     user: array{id: int|string, name: string|null, username: string|null, avatar_url: string|null}|null
     * }|null
     */
    public static function for(Post $post): ?array
    {
        if (! $post->exists) {
            return null;
        }

        /** @var PostRevision|null $revision */
        $revision = $post->revisions()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first(['id', 'user_id', 'created_at']);

        if ($revision === null) {
            return null;
        }

        $userId = is_int($revision->user_id) ? $revision->user_id : null;

        return [
            'id' => (string) $revision->getKey(),
            'user_id' => $userId,
            'created_at' => $revision->created_at,
            'user' => PostAuthor::forUserId($userId),
        ];
    }
}
