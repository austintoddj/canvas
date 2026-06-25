<?php

declare(strict_types=1);

namespace Canvas\Policies;

class UserPolicy
{
    public function create(object $user): bool
    {
        return $user->isAdmin ?? false;
    }

    public function update(object $user, object $targetUser): bool
    {
        if ($user->isAdmin ?? false) {
            return true;
        }

        return $user->id === $targetUser->id;
    }

    public function delete(object $user, object $targetUser): bool
    {
        if ($user->id === $targetUser->id) {
            return false;
        }

        return $user->isAdmin ?? false;
    }
}
