<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\VisitFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Visit extends Model
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
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): Factory
    {
        return VisitFactory::new();
    }

    /**
     * Get the post relationship.
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
