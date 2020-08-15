<?php

namespace Canvas\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Str;

class Post extends Model
{
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
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = [
        'published_at',
    ];

    /**
     * The attributes that should be casted.
     *
     * @var array
     */
    protected $casts = [
        'meta' => 'array',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'read_time',
    ];

    /**
     * Get the tags relationship.
     *
     * @return BelongsToMany
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
     *
     * @return BelongsToMany
     */
    public function topic(): BelongsToMany
    {
        return $this->belongsToMany(
            Topic::class,
            'canvas_posts_topics',
            'post_id',
            'topic_id'
        );
    }

    /**
     * Get the user relationship.
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(config('canvas.user', User::class));
    }

    /**
     * Get the user meta relationship.
     *
     * @return HasOneThrough
     */
    public function userMeta(): HasOneThrough
    {
        return $this->hasOneThrough(
            UserMeta::class,
            config('canvas.user', User::class),
            'id',       // Foreign key on users table...
            'user_id',  // Foreign key on canvas_posts table...
            'user_id',  // Local key on canvas_posts table...
            'id'        // Local key on users table...
        );
    }

    /**
     * Get the views relationship.
     *
     * @return HasMany
     */
    public function views(): HasMany
    {
        return $this->hasMany(View::class);
    }

    /**
     * Get the visits relationship.
     *
     * @return HasMany
     */
    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class);
    }

    /**
     * Check to see if the post is published.
     *
     * @return bool
     */
    public function getPublishedAttribute(): bool
    {
        return ! is_null($this->published_at) && $this->published_at <= now()->toDateTimeString();
    }

    /**
     * Get the human-friendly estimated reading time of a post.
     *
     * @return string
     */
    public function getReadTimeAttribute(): string
    {
        // Only count words in our estimation
        $words = str_word_count(strip_tags($this->body));

        // Divide by the average number of words per minute
        $minutes = ceil($words / 250);

        return sprintf('%d %s %s',
            $minutes,
            Str::plural(trans('canvas::app.min', [], optional($this->userMeta)->locale), $minutes),
            trans('canvas::app.read', [], optional($this->userMeta)->locale)
        );
    }

    /**
     * Get the 10 most popular reading times rounded to the nearest 30 minutes.
     *
     * @return array
     */
    public function getPopularReadingTimesAttribute(): array
    {
        // Get the views associated with the post
        $data = $this->views;

        // Filter the view data to only include hours:minutes
        $collection = collect();
        $data->each(function ($item, $key) use ($collection) {
            $collection->push($item->created_at->minute(0)->format('H:i'));
        });

        // Count the unique values and assign to their respective keys
        $filtered = array_count_values($collection->toArray());

        $popularReadingTimes = collect();
        foreach ($filtered as $key => $value) {
            // Use each given time to create a 60 min range
            $start = Date::createFromTimeString($key);
            $end = $start->copy()->addMinutes(60);

            // Find the percentage based on the value
            $percentage = number_format($value / $data->count() * 100, 2);

            // Get a human-readable hour range and floating percentage
            $popularReadingTimes->put(
                sprintf('%s - %s', $start->format('g:i A'), $end->format('g:i A')),
                $percentage
            );
        }

        // Cast the collection to an array
        $array = $popularReadingTimes->toArray();

        // Only return the top 5 reading times and percentages
        $sliced = array_slice($array, 0, 5, true);

        // Sort the array in a descending order
        arsort($sliced);

        return $sliced;
    }

    /**
     * Get the top referring websites for a post.
     *
     * @return array
     */
    public function getTopReferersAttribute(): array
    {
        // Get the views associated with the post
        $data = $this->views;

        // Filter the view data to only include referrers
        $collection = collect();
        $data->each(function ($item, $key) use ($collection) {
            if (empty(parse_url($item->referer)['host'])) {
                $collection->push(trans('canvas::app.other', [], optional($this->userMeta)->locale));
            } else {
                $collection->push(parse_url($item->referer)['host']);
            }
        });

        // Count the unique values and assign to their respective keys
        $array = array_count_values($collection->toArray());

        // Only return the top N referrers with their view count
        $sliced = array_slice($array, 0, 10, true);

        // Sort the array in a descending order
        arsort($sliced);

        return $sliced;
    }

    /**
     * Scope a query to only include published posts.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopePublished($query): Builder
    {
        return $query->where('published_at', '<=', now()->toDateTimeString());
    }

    /**
     * Scope a query to only include drafted posts.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeDraft($query): Builder
    {
        return $query->where('published_at', null)->orWhere('published_at', '>', now()->toDateTimeString());
    }

    /**
     * Scope a query to include posts for a given set of filters.
     *
     * Supported: "scope", "type"
     *
     * @param $query
     * @param $user
     * @param array $filters
     * @return Builder
     */
    public function scopeFilterBy($query, $user, $filters = []): Builder
    {
        if (! $filters) {
            return $query;
        }

        $meta = UserMeta::where('user_id', $user->id)->first();

        if (isset($filters['scope']) && $filters['scope'] === 'user' || ! optional($meta)->admin) {
            $query->where('user_id', $user->id);
        }

        if (isset($filters['type']) && $filters['type'] === 'draft') {
            $query->draft();
        } else {
            $query->published();
        }

        return $query;
    }

    /**
     * Scope a query to eager load user meta.
     *
     * @param $query
     * @return Builder
     */
    public function scopeWithUserMeta($query): Builder
    {
        return $query->with('userMeta');
    }

    /**
     * The "booting" method of the model.
     *
     * @return void
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($item) {
            $item->tags()->detach();
            $item->topic()->detach();
        });
    }
}
