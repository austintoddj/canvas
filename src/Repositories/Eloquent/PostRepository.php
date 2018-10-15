<?php

namespace Canvas\Repositories\Eloquent;

use Canvas\Entities\Post;
use Illuminate\Support\Collection;
use Canvas\Interfaces\PostInterface;

class PostRepository extends EloquentAbstract implements PostInterface
{
    /**
     * @var Post
     */
    protected $model;

    /**
     * PostRepository constructor.
     *
     * @param Post $post
     */
    public function __construct(Post $post)
    {
        $this->model = $post;
    }

    /**
     * @param string $user_id
     * @return Collection
     */
    public function getByUserId(string $user_id): Collection
    {
        return $this->model->where('user_id', $user_id)->get();
    }
}
