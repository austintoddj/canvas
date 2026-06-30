<?php

declare(strict_types=1);

namespace Canvas\Policies;

use Canvas\Models\CanvasUser;

class UserPolicy
{
    public function create(object $user): bool
    {
        return CanvasUser::isAdmin($user);
    }

    public function update(object $user, object $targetUser): bool
    {
        if (CanvasUser::isAdmin($user)) {
            return true;
        }

        return $user->id === $targetUser->id;
    }

    public function delete(object $user, object $targetUser): bool
    {
        if ($user->id === $targetUser->id) {
            return false;
        }

        return CanvasUser::isAdmin($user);
    }
}
