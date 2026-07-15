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
    public static $wrap = null;

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
            'theme' => 'system',
            'digest' => false,
            'preferences' => UserPreferences::defaults(),
            'updated_at' => null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return self::toProfileArray($this->resource);
    }

    /**
     * @return array<string, mixed>
     */
    public static function toProfileArray(?CanvasUser $canvasUser): array
    {
        if (! $canvasUser) {
            return self::defaults();
        }

        return [
            'role' => $canvasUser->role->value,
            'username' => $canvasUser->username,
            'summary' => $canvasUser->summary,
            'avatar' => $canvasUser->avatar,
            'avatar_url' => AuthorAvatar::url($canvasUser->avatar),
            'website' => $canvasUser->website,
            'social' => $canvasUser->socialLinks(),
            'locale' => Localization::resolveLocale($canvasUser->locale),
            'timezone' => $canvasUser->timezone ?? config('app.timezone'),
            'theme' => $canvasUser->theme ?? 'system',
            'digest' => (bool) $canvasUser->digest,
            'preferences' => $canvasUser->resolvedPreferences(),
            'updated_at' => $canvasUser->updated_at?->toIso8601String(),
        ];
    }
}
