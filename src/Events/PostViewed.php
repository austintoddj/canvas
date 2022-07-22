<?php

declare(strict_types=1);

namespace Canvas\Events;

use Canvas\Models\Post;

class PostViewed
{
    /**
     * The post instance.
     *
     * @var Post
     */
    public Post $post;

    /**
     * Create a new event instance.
     *
     * @param  Post  $post
     */
    public function __construct(Post $post)
    {
        $this->post = $post;
    }
}
