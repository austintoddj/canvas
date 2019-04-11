<?php

namespace Canvas\Relations;

use Illuminate\Database\Eloquent\Relations\Pivot;

final class PostsTags extends Pivot
{
    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'canvas_posts_tags';
}
