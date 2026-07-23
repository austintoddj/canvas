<?php

declare(strict_types=1);

namespace Canvas\Events;

use Canvas\Models\Post;

final class PostUpdated
{
    public function __construct(
        public readonly Post $post,
    ) {}
}
