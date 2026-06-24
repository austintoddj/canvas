<?php

namespace Canvas\Models;

use Canvas\Database\Factories\TagFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tag extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'canvas_tags';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

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
     * The number of models to return for pagination.
     *
     * @var int
     */
    protected $perPage = 10;

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): Factory
    {
        return TagFactory::new();
    }

    /**
     * Get the posts relationship.
     */
    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'canvas_posts_tags', 'tag_id', 'post_id');
    }

    /**
     * Get the user relationship.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(config('canvas.user_model'));
    }

    /**
     * The "booting" method of the model.
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function (self $tag) {
            $tag->posts()->detach();
        });
    }
}
