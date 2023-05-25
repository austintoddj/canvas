<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\ViewFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class View extends AbstractCanvasModel
{
    use HasFactory;

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
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Create a new factory instance for the model.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    protected static function newFactory()
    {
        return ViewFactory::new();
    }
}
