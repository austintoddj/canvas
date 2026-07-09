<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\VisitFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @use HasFactory<VisitFactory>
 */
class Visit extends Model
{
    /** @use HasFactory<VisitFactory> */
    use HasFactory;

    protected $table = 'canvas_visits';

    /** @var list<string> */
    protected $guarded = [];

    protected static function newFactory(): VisitFactory
    {
        return VisitFactory::new();
    }

    /**
     * @return BelongsTo<Post, $this>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
}
