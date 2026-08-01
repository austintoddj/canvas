<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\PostRevisionFactory;
use Canvas\Enums\RevisionReason;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @use HasFactory<PostRevisionFactory>
 */
class PostRevision extends Model
{
    /** @use HasFactory<PostRevisionFactory> */
    use HasFactory;

    /** Keep the newest N checkpoints per post (prune-on-write + artisan). */
    public const int DEFAULT_KEEP_PER_POST = 50;

    protected $table = 'canvas_post_revisions';

    /** @var list<string> */
    protected $guarded = [];

    protected $keyType = 'string';

    public $incrementing = false;

    /** @var array<string, string> */
    protected $casts = [
        'user_id' => 'integer',
        'reason' => RevisionReason::class,
        'meta' => 'array',
    ];

    protected static function newFactory(): PostRevisionFactory
    {
        return PostRevisionFactory::new();
    }

    /**
     * @return BelongsTo<Post, $this>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'post_id');
    }

    /**
     * @return BelongsTo<Model, $this>
     */
    public function user(): BelongsTo
    {
        /** @var class-string<Model> $userModel */
        $userModel = config('canvas.user_model');

        return $this->belongsTo($userModel);
    }
}
