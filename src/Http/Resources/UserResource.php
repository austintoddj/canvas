<?php

declare(strict_types=1);

namespace Canvas\Http\Resources;

use Canvas\Models\CanvasUser;
use Canvas\Support\AuthorAvatar;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Model
 *
 * @property Model $resource
 */
class UserResource extends JsonResource
{
    public static $wrap = null;

    public static function hostUserFromCanvasUser(CanvasUser $canvasUser): Model
    {
        $hostUser = $canvasUser->user;

        if ($hostUser === null) {
            abort(404);
        }

        $hostUser->setRelation('canvasUser', $canvasUser);

        if (isset($canvasUser->posts_count)) {
            $hostUser->setAttribute('posts_count', $canvasUser->posts_count);
        }

        return $hostUser;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Model $user */
        $user = $this->resource;
        $email = (string) data_get($user, 'email', '');
        $canvasUser = $this->loadedCanvasUser($user);

        return [
            'id' => $user->getKey(),
            'name' => data_get($user, 'name'),
            'email' => $email,
            'avatar_url' => AuthorAvatar::url($canvasUser?->avatar, $email),
            'posts_count' => $this->when(
                array_key_exists('posts_count', $user->getAttributes()),
                fn (): mixed => $user->getAttribute('posts_count'),
            ),
            'canvas' => $this->when(
                $canvasUser !== null,
                fn (): array => CanvasUserResource::toProfileArray($canvasUser, $email),
            ),
        ];
    }

    private function loadedCanvasUser(Model $user): ?CanvasUser
    {
        if (! $user->relationLoaded('canvasUser')) {
            return null;
        }

        $canvasUser = $user->getRelation('canvasUser');

        return $canvasUser instanceof CanvasUser ? $canvasUser : null;
    }
}
