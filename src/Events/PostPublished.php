<?php

declare(strict_types=1);

namespace Canvas\Events;

use Canvas\Models\Post;

final class PostPublished
{
    public function __construct(
        public readonly Post $post,
    ) {}
}
