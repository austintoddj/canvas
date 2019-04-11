<?php

namespace Canvas\Events;

use Canvas\Models\Post;

class PostViewed
{
    /**
     * The post that was viewed.
     *
     * @var Post
     */
    public $post;

    /**
     * Create a new event instance.
     *
     * @param Post $post
     */
    public function __construct(Post $post)
    {
        $this->post = $post;
    }
}
