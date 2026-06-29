<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\Role;
use Canvas\Http\Resources\UserResource;
use Canvas\Models\CanvasUser;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;

final class FrontendBootData
{
    public static function forUser(Authenticatable $user): array
    {
        if (method_exists($user, 'canvasUser')) {
            $user->loadMissing('canvasUser');
        }

        $canvasUser = self::resolveCanvasUser($user);

        if ($canvasUser !== null && $user instanceof Model) {
            $user->setRelation('canvasUser', $canvasUser);
        }

        $locale = Localization::resolveLocale($canvasUser?->locale);

        return [
            'languageCodes' => Localization::availableLanguageCodes(),
            'maxUpload' => config('canvas.upload_filesize'),
            'path' => Paths::basePath(),
            'roles' => Role::options(),
            'timezone' => config('app.timezone'),
            'translations' => Localization::availableTranslations($locale),
            'unsplash' => config('canvas.unsplash.access_key'),
            'user' => UserResource::make($user)->resolve(),
            'version' => Version::installed(),
        ];
    }

    private static function resolveCanvasUser(Authenticatable $user): ?CanvasUser
    {
        if ($user->relationLoaded('canvasUser')) {
            return $user->getRelation('canvasUser');
        }

        if (method_exists($user, 'canvasUser')) {
            return $user->canvasUser;
        }

        return CanvasUser::query()->find($user->getAuthIdentifier());
    }
}
