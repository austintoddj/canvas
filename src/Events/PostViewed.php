<?php

namespace Canvas\Events;

use Canvas\Models\Post;

class PostViewed
{
    /**
     * Create a new event instance.
     */
    public function __construct(
        public readonly Post $post,
        public readonly string $ip,
        public readonly ?string $agent,
        public readonly ?string $referer,
    ) {}
}
