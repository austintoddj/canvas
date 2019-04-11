<?php

namespace Canvas\Models;

use Canvas\Relations\PostsTopics;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Carbon;

/**
 * Canvas\Models\Topic
 *
 * @property string                                               $id
 * @property string                                               $slug
 * @property string                                               $name
 * @property Carbon|null                      $created_at
 * @property Carbon|null                      $updated_at
 * @property Carbon|null                      $deleted_at
 * @property-read Collection|Post[] $posts
 * @method static bool|null forceDelete()
 * @method static EloquentBuilder|Topic newModelQuery()
 * @method static EloquentBuilder|Topic newQuery()
 * @method static QueryBuilder|Topic onlyTrashed()
 * @method static EloquentBuilder|Topic query()
 * @method static bool|null restore()
 * @method static EloquentBuilder|Topic whereCreatedAt($value)
 * @method static EloquentBuilder|Topic whereDeletedAt($value)
 * @method static EloquentBuilder|Topic whereId($value)
 * @method static EloquentBuilder|Topic whereName($value)
 * @method static EloquentBuilder|Topic whereSlug($value)
 * @method static EloquentBuilder|Topic whereUpdatedAt($value)
 * @method static QueryBuilder|Topic withTrashed()
 * @method static QueryBuilder|Topic withoutTrashed()
 * @mixin Model
 * @mixin EloquentBuilder
 */
class Topic extends Model
{
    use SoftDeletes;

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
    protected $table = 'canvas_topics';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * The "type" of the auto-incrementing ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * Get the posts relationship.
     *
     * @return HasManyThrough
     */
    public function posts(): HasManyThrough
    {
        return $this->hasManyThrough(
            Post::class,
            PostsTopics::class,
            'topic_id', // Foreign key on canvas_posts_topics table...
            'id', // Foreign key on canvas_posts table...
            'id', // Local key on canvas_topics table...
            'post_id' // Local key on canvas_posts_topics table...
        );
    }
}
