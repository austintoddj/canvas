<?php

declare(strict_types=1);

namespace Canvas\Policies;

use Canvas\Models\CanvasUser;
use Canvas\Models\Media;

class MediaPolicy
{
    public function viewAll(object $user): bool
    {
        return ! CanvasUser::isContributor($user);
    }

    public function view(object $user, Media $media): bool
    {
        if ($this->viewAll($user)) {
            return true;
        }

        return $media->user_id === $user->id;
    }

    public function update(object $user, Media $media): bool
    {
        return $this->view($user, $media);
    }

    public function delete(object $user, Media $media): bool
    {
        return $this->view($user, $media);
    }
}
