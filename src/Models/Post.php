<?php

namespace Canvas\Models;

use Canvas\Database\Factories\PostFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

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
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

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
        // Only count words in our estimation
        $words = str_word_count(strip_tags($this->body));

        // Divide by the average number of words per minute
        $minutes = ceil($words / 250);

        // The user is optional since we append this attribute
        // to every model and we may be creating a new one
        return vsprintf('%d %s %s', [
            $minutes,
            Str::plural(trans('canvas::app.min', [], optional(request()->user())->locale), $minutes),
            trans('canvas::app.read', [], optional(request()->user())->locale),
        ]
        );
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
        return $query->where('published_at', '=', null)->orWhere('published_at', '>', now()->toDateTimeString());
    }

    /**
     * The "booting" method of the model.
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function (self $post) {
            $post->tags()->detach();
        });
    }
}
