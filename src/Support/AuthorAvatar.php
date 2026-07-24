<?php

declare(strict_types=1);

namespace Canvas\Support;

final class AuthorAvatar
{
    /**
     * Resolve a stored avatar value for API / display.
     *
     * Accepts root-relative public-disk paths (`/storage/...`) and absolute
     * remote URLs. Returns the same form that should be persisted (root-relative
     * for local storage, absolute for remote). Non-media garbage yields null.
     */
    public static function url(?string $avatar): ?string
    {
        if (! filled($avatar)) {
            return null;
        }

        $avatar = trim($avatar);

        if ($avatar === '') {
            return null;
        }

        if (MediaUrl::isPublicStorageReference($avatar)) {
            return MediaUrl::toStoredMediaReference($avatar);
        }

        if (filter_var($avatar, FILTER_VALIDATE_URL) !== false) {
            return $avatar;
        }

        return null;
    }
}
