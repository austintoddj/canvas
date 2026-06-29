<?php

declare(strict_types=1);

namespace Canvas\Http\Resources;

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

        return [
            'id' => $this->getKey(),
            'name' => data_get($this->resource, 'name'),
            'email' => $email,
            'avatar_url' => AuthorAvatar::url(
                $this->relationLoaded('canvasUser') ? $this->canvasUser?->avatar : null,
                $email,
            ),
            'posts_count' => $this->whenCounted('posts'),
            'canvas' => $this->when(
                $this->relationLoaded('canvasUser') && $this->canvasUser,
                fn (): array => CanvasUserResource::toProfileArray($this->canvasUser, $email),
            ),
        ];
    }
}
