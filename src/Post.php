<?php

namespace Canvas;

use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
     * Get the tags relationship.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'canvas_posts_tags', 'post_id', 'tag_id');
    }

    /**
     * Get the topics relationship.
     *
     * @return belongsToMany
     */
    public function topic(): belongsToMany
    {
        return $this->belongsToMany(Topic::class, 'canvas_posts_topics', 'post_id', 'topic_id');
    }

    /**
     * Get the user relationship.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
     * Get the user who authored the post.
     *
     * @return User
     */
    public function getAuthorAttribute(): User
    {
        return $this->user;
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

        return sprintf('%d %s %s', $minutes, Str::plural(__('canvas::stats.details.reading.time'), $minutes), __('canvas::stats.details.reading.read'));
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

        $popular_reading_times = collect();
        foreach ($filtered as $key => $value) {
            // Use each given time to create a 60 min range
            $start_time = Carbon::createFromTimeString($key);
            $end_time = $start_time->copy()->addMinutes(60);

            // Find the percentage based on the value
            $percentage = number_format($value / $data->count() * 100, 2);

            // Get a human-readable hour range and floating percentage
            $popular_reading_times->put(
                sprintf('%s - %s', $start_time->format('g:i A'), $end_time->format('g:i A')),
                $percentage
            );
        }

        // Cast the collection to an array
        $array = $popular_reading_times->toArray();

        // Only return the top 5 reading times and percentages
        $sliced = array_slice($array, 0, 5, true);

        // Sort the array in a descending order
        arsort($sliced);

        return $sliced;
    }

    /**
     * Get the top 10 referring websites for a post.
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
            is_null($item->referer) ? $collection->push(__('canvas::stats.details.referer.other')) : $collection->push(parse_url($item->referer)['host']);
        });

        // Count the unique values and assign to their respective keys
        $array = array_count_values($collection->toArray());

        // Only return the top 10 referrers with their view count
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
        return $query->where('published_at', '>', now()->toDateTimeString());
    }
}
