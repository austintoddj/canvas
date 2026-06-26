<?php

declare(strict_types=1);

namespace Canvas\Support;

use Canvas\Enums\Role;
use Illuminate\Contracts\Auth\Authenticatable;

final class FrontendBootData
{
    public static function forUser(Authenticatable $user): array
    {
        $locale = data_get($user, 'locale') ?? config('app.locale');

        return [
            'languageCodes' => Localization::availableLanguageCodes(),
            'maxUpload' => config('canvas.upload_filesize'),
            'path' => Paths::basePath(),
            'roles' => Role::options(),
            'timezone' => config('app.timezone'),
            'translations' => Localization::availableTranslations($locale),
            'unsplash' => config('canvas.unsplash.access_key'),
            'user' => self::userData($user, $locale),
            'version' => Version::installed(),
        ];
    }

    private static function userData(Authenticatable $user, string $locale): array
    {
        $role = data_get($user, 'canvas_role')
            ?? data_get($user, 'canvasUser.role')
            ?? data_get($user, 'role');

        if ($role instanceof Role) {
            $role = $role->value;
        }

        return [
            'id' => $user->getAuthIdentifier(),
            'name' => data_get($user, 'name'),
            'email' => data_get($user, 'email'),
            'avatar' => data_get($user, 'avatar'),
            'locale' => $locale,
            'dark_mode' => (bool) data_get($user, 'dark_mode', false),
            'digest' => (bool) data_get($user, 'digest', false),
            'role' => is_numeric($role) ? (int) $role : null,
            'default_avatar' => data_get(
                $user,
                'default_avatar',
                Gravatar::url((string) data_get($user, 'email', ''))
            ),
            'default_locale' => data_get($user, 'default_locale', config('app.locale')),
        ];
    }
}
