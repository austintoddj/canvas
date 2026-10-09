<?php

declare(strict_types=1);

namespace Canvas\Policies;

use Canvas\Models\CanvasUser;
use Canvas\Models\MediaTag;

class MediaTagPolicy
{
    public function viewAny(object $user): bool
    {
        return true;
    }

    public function view(object $user, MediaTag $tag): bool
    {
        return true;
    }

    public function create(object $user): bool
    {
        return true;
    }

    public function update(object $user, MediaTag $tag): bool
    {
        return ! CanvasUser::isContributor($user);
    }

    public function delete(object $user, MediaTag $tag): bool
    {
        return $this->update($user, $tag);
    }
}
