<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\TopicFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @use HasFactory<TopicFactory>
 */
class Topic extends Model
{
    /** @use HasFactory<TopicFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $table = 'canvas_topics';

    /** @var list<string> */
    protected $guarded = [];

    protected $keyType = 'string';

    public $incrementing = false;

    protected $perPage = 10;

    /** @var array<string, string> */
    protected $casts = [
        'user_id' => 'integer',
    ];

    protected static function newFactory(): TopicFactory
    {
        return TopicFactory::new();
    }

    /**
     * @return HasMany<Post, $this>
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'topic_id');
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
        static::deleting(function (self $topic): void {
            $topic->posts()->update(['topic_id' => null]);
        });
    }
}
