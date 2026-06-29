<?php

declare(strict_types=1);

namespace Canvas\Http\Resources;

use Canvas\Models\CanvasUser;
use Canvas\Support\AuthorAvatar;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $email = (string) data_get($this->resource, 'email', '');
        $canvasUser = $this->loadedCanvasUser();

        return [
            'id' => $this->getKey(),
            'name' => data_get($this->resource, 'name'),
            'email' => $email,
            'avatar_url' => AuthorAvatar::url($canvasUser?->avatar, $email),
            'posts_count' => $this->whenCounted('posts'),
            'canvas' => $this->when(
                $canvasUser !== null,
                fn (): array => CanvasUserResource::toProfileArray($canvasUser, $email),
            ),
        ];
    }

    private function loadedCanvasUser(): ?CanvasUser
    {
        if (! $this->relationLoaded('canvasUser')) {
            return null;
        }

        $canvasUser = $this->resource->getRelation('canvasUser');

        return $canvasUser instanceof CanvasUser ? $canvasUser : null;
    }
}
