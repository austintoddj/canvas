<?php

declare(strict_types=1);

namespace Canvas\Http\Resources;

use Canvas\Data\UserPreferences;
use Canvas\Models\CanvasUser;
use Canvas\Support\AuthorAvatar;
use Canvas\Support\Localization;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CanvasUser
 */
class CanvasUserResource extends JsonResource
{
    private string $email = '';

    public function withEmail(string $email): self
    {
        $this->email = $email;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'role' => null,
            'username' => null,
            'summary' => null,
            'avatar' => null,
            'avatar_url' => null,
            'website' => null,
            'social' => [],
            'locale' => config('app.fallback_locale'),
            'timezone' => config('app.timezone'),
            'dark_mode' => false,
            'digest' => false,
            'preferences' => UserPreferences::defaults(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return self::toProfileArray($this->resource, $this->email);
    }

    /**
     * @return array<string, mixed>
     */
    public static function toProfileArray(?CanvasUser $canvasUser, string $email = ''): array
    {
        if (! $canvasUser) {
            return self::defaults();
        }

        return [
            'role' => $canvasUser->role?->value,
            'username' => $canvasUser->username,
            'summary' => $canvasUser->summary,
            'avatar' => $canvasUser->avatar,
            'avatar_url' => AuthorAvatar::url($canvasUser->avatar, $email),
            'website' => $canvasUser->website,
            'social' => $canvasUser->socialLinks(),
            'locale' => Localization::resolveLocale($canvasUser->locale),
            'timezone' => $canvasUser->timezone ?? config('app.timezone'),
            'dark_mode' => (bool) $canvasUser->dark_mode,
            'digest' => (bool) $canvasUser->digest,
            'preferences' => $canvasUser->resolvedPreferences(),
        ];
    }
}
