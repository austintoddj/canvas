<?php

namespace Canvas;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class View extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'canvas_views';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    /**
     * Get the post relationship.
     *
     * @return BelongsTo
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Scope a query to filter post views within a given date range.
     *
     * @param $query
     * @param $postIDs
     * @param $startDate
     * @param $endDate
     * @return Builder
     */
    public function scopeForPostsInRange($query, $postIDs, $startDate, $endDate): Builder
    {
        return $query->whereIn('post_id', $postIDs)
                     ->whereBetween('created_at', [
                         $startDate,
                         $endDate,
                     ]);
    }
}
