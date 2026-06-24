<?php

declare(strict_types=1);

namespace Canvas\Policies;

use Canvas\Models\Post;

class PostPolicy
{
    public function viewAll(object $user): bool
    {
        return ! ($user->isContributor ?? false);
    }

    public function view(object $user, Post $post): bool
    {
        if ($this->viewAll($user)) {
            return true;
        }

        return $post->user_id === $user->id;
    }

    public function update(object $user, Post $post): bool
    {
        return $this->view($user, $post);
    }

    public function delete(object $user, Post $post): bool
    {
        return $this->view($user, $post);
    }
}
