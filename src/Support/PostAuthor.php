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

        $canvasUser = CanvasUser::query()->find($post->user_id);

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
