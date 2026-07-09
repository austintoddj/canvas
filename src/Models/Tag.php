<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\TagFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @use HasFactory<TagFactory>
 */
class Tag extends Model
{
    /** @use HasFactory<TagFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $table = 'canvas_tags';

    /** @var list<string> */
    protected $guarded = [];

    protected $keyType = 'string';

    public $incrementing = false;

    protected $perPage = 10;

    /** @var array<string, string> */
    protected $casts = [
        'user_id' => 'integer',
    ];

    protected static function newFactory(): TagFactory
    {
        return TagFactory::new();
    }

    /**
     * @return BelongsToMany<Post, $this>
     */
    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'canvas_posts_tags', 'tag_id', 'post_id');
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

    protected static function booted(): void
    {
        static::deleting(function (self $tag): void {
            $tag->posts()->detach();
        });
    }
}
