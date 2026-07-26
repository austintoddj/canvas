<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Models\CanvasUser;
use Canvas\Models\Media;
use Illuminate\Database\Eloquent\Model;

final class MediaUploader
{
    /**
     * Lite uploader payload for the media drawer (display-only).
     *
     * @return array{id: int|string, name: string|null, username: string|null, avatar_url: string|null}|null
     */
    public static function for(Media $media): ?array
    {
        if ($media->user_id === null) {
            return null;
        }

        $user = self::resolveHostUser($media);

        if ($user === null) {
            return null;
        }

        $canvasUser = CanvasUser::query()->find($media->user_id);

        return [
            'id' => $user->getKey(),
            'name' => data_get($user, 'name'),
            'username' => $canvasUser?->username,
            'avatar_url' => AuthorAvatar::url($canvasUser?->avatar),
        ];
    }

    private static function resolveHostUser(Media $media): ?Model
    {
        if ($media->relationLoaded('user')) {
            $user = $media->getRelation('user');

            return $user instanceof Model ? $user : null;
        }

        /** @var class-string<Model> $userModel */
        $userModel = config('canvas.user_model');

        return $userModel::query()->find($media->user_id);
    }
}
