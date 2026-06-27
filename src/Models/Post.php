<?php

declare(strict_types=1);

namespace Canvas\Models;

use Canvas\Database\Factories\PostFactory;
use Canvas\Support\ReadTime;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'canvas_posts';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

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
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'read_time',
    ];

    /**
     * The attributes that should be casted.
     *
     * @var array
     */
    protected $casts = [
        'published_at' => 'datetime:Y-m-d',
        'meta' => 'array',
    ];

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): Factory
    {
        return PostFactory::new();
    }

    /**
     * Get the tags relationship.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(
            Tag::class,
            'canvas_posts_tags',
            'post_id',
            'tag_id'
        );
    }

    /**
     * Get the topic relationship.
     */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class, 'topic_id');
    }

    /**
     * Get the user relationship.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(config('canvas.user_model'));
    }

    /**
     * Get the views relationship.
     */
    public function views(): HasMany
    {
        return $this->hasMany(View::class);
    }

    /**
     * Get the visits relationship.
     */
    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class);
    }

    /**
     * Get the human-friendly estimated reading time of a given text.
     */
    public function getReadTimeAttribute(): string
    {
        return ReadTime::calculate($this->body, request()->user()?->locale);
    }

    /**
     * Check to see if the post is published.
     */
    public function getPublishedAttribute(): bool
    {
        return ! is_null($this->published_at) && $this->published_at <= now()->toDateTimeString();
    }

    /**
     * Scope a query to only include published posts.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('published_at', '<=', now()->toDateTimeString());
    }

    /**
     * Scope a query to only include drafted posts.
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where(fn (Builder $q) => $q
            ->whereNull('published_at')
            ->orWhere('published_at', '>', now())
        );
    }

    /**
     * The "booting" method of the model.
     */
    protected static function booted(): void
    {
        static::deleting(function (self $post) {
            $post->tags()->detach();
        });
    }
}
