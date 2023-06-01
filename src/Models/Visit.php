<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\VisitFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Visit extends AbstractCanvasModel
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'canvas_visits';

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
        return VisitFactory::new();
    }
}
