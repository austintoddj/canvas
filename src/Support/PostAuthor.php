<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Illuminate\Database\Eloquent\Model;

final class PostAuthor
{
    /**
     * Lite author payload for admin SPA (display-only; never accepts writes).
     *
     * @return array{id: int|string, name: string|null, username: string|null, avatar_url: string|null}|null
     */
    public static function for(Post $post): ?array
    {
        if ($post->user_id === null) {
            return null;
        }

        $user = self::resolveHostUser($post);

        if ($user === null) {
            return null;
        }

        return self::payload($user, (int) $post->user_id);
    }

    /**
     * Lite author payload for a host user id (e.g. revision actor).
     *
     * @return array{id: int|string, name: string|null, username: string|null, avatar_url: string|null}|null
     */
    public static function forUserId(?int $userId): ?array
    {
        if ($userId === null) {
            return null;
        }

        /** @var class-string<Model> $userModel */
        $userModel = config('canvas.user_model');
        $user = $userModel::query()->find($userId);

        if (! $user instanceof Model) {
            return null;
        }

        return self::payload($user, $userId);
    }

    /**
     * Batch-map host user ids to lite author payloads (avoids N+1 on revision lists).
     *
     * @param  list<int|null>  $userIds
     * @return array<int, array{id: int|string, name: string|null, username: string|null, avatar_url: string|null}>
     */
    public static function mapByUserIds(array $userIds): array
    {
        $ids = array_values(array_unique(array_filter(
            $userIds,
            static fn (mixed $id): bool => is_int($id) && $id > 0
        )));

        if ($ids === []) {
            return [];
        }

        /** @var class-string<Model> $userModel */
        $userModel = config('canvas.user_model');
        $users = $userModel::query()->whereIn('id', $ids)->get()->keyBy(
            static fn (Model $user): int => (int) $user->getKey()
        );
        $canvasUsers = CanvasUser::query()->whereIn('id', $ids)->get()->keyBy('id');

        $mapped = [];

        foreach ($ids as $id) {
            $user = $users->get($id);

            if (! $user instanceof Model) {
                continue;
            }

            $canvasUser = $canvasUsers->get($id);

            $mapped[$id] = [
                'id' => $user->getKey(),
                'name' => data_get($user, 'name'),
                'username' => $canvasUser?->username,
                'avatar_url' => AuthorAvatar::url($canvasUser?->avatar),
            ];
        }

        return $mapped;
    }

    /**
     * @return array{id: int|string, name: string|null, username: string|null, avatar_url: string|null}
     */
    private static function payload(Model $user, int $userId): array
    {
        $canvasUser = CanvasUser::query()->find($userId);

        return [
            'id' => $user->getKey(),
            'name' => data_get($user, 'name'),
            'username' => $canvasUser?->username,
            'avatar_url' => AuthorAvatar::url($canvasUser?->avatar),
        ];
    }

    private static function resolveHostUser(Post $post): ?Model
    {
        if ($post->relationLoaded('user')) {
            $user = $post->getRelation('user');

            return $user instanceof Model ? $user : null;
        }

        /** @var class-string<Model> $userModel */
        $userModel = config('canvas.user_model');

        return $userModel::query()->find($post->user_id);
    }
}
