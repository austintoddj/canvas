<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\ViewFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @use HasFactory<ViewFactory>
 */
class View extends Model
{
    /** @use HasFactory<ViewFactory> */
    use HasFactory;

    protected $table = 'canvas_views';

    /** @var list<string> */
    protected $guarded = [];

    protected static function newFactory(): ViewFactory
    {
        return ViewFactory::new();
    }

    /**
     * @return BelongsTo<Post, $this>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
