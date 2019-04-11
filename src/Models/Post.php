<?php

namespace Canvas\Models;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Canvas\Models\Post
 *
 * @property-read User               $author
 * @property-read array              $popular_reading_times
 * @property-read bool               $published
 * @property-read string             $read_time
 * @property-read array              $top_referers
 * @property-read array              $view_trend
 * @property-read Collection|Tag[]   $tags
 * @property-read Collection|Topic[] $topic
 * @property-read User               $user
 * @property-read Collection|View[]  $views
 * @method static bool|null forceDelete()
 * @method static Builder|Post newModelQuery()
 * @method static Builder|Post newQuery()
 * @method static \Illuminate\Database\Query\Builder|Post onlyTrashed()
 * @method static Builder|Post published()
 * @method static Builder|Post query()
 * @method static bool|null restore()
 * @method static \Illuminate\Database\Query\Builder|Post withTrashed()
 * @method static \Illuminate\Database\Query\Builder|Post withoutTrashed()
 * @property string $id
 * @property string $slug
 * @property string $title
 * @property string|null $summary
 * @property string|null $body
 * @property \Illuminate\Support\Carbon $published_at
 * @property string|null $featured_image
 * @property string|null $featured_image_caption
 * @property string $user_id
 * @property array|null $meta
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @method static Builder|Post whereBody($value)
 * @method static Builder|Post whereCreatedAt($value)
 * @method static Builder|Post whereDeletedAt($value)
 * @method static Builder|Post whereFeaturedImage($value)
 * @method static Builder|Post whereFeaturedImageCaption($value)
 * @method static Builder|Post whereId($value)
 * @method static Builder|Post whereMeta($value)
 * @method static Builder|Post wherePublishedAt($value)
 * @method static Builder|Post whereSlug($value)
 * @method static Builder|Post whereSummary($value)
 * @method static Builder|Post whereTitle($value)
 * @method static Builder|Post whereUpdatedAt($value)
 * @method static Builder|Post whereUserId($value)
 * @mixin Model
 * @mixin Builder
 */
class Post extends Model
{
    use SoftDeletes;

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'canvas_posts';

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
    public $dates = [
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
     * @return BelongsToMany
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'canvas_posts_tags', 'post_id', 'tag_id');
    }

    /**
     * Get the topics relationship.
     *
     * @return BelongsToMany
     */
    public function topic(): BelongsToMany
    {
        return $this->belongsToMany(Topic::class, 'canvas_posts_topics', 'post_id', 'topic_id');
    }

    /**
     * Get the user relationship.
     *
     * @return BelongsTo
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
        /** @noinspection PhpUndefinedMethodInspection */
        return User::find($this->user_id);
    }

    /**
     * Check to see if the post is published.
     *
     * @return bool
     */
    public function getPublishedAttribute(): bool
    {
        if ($this->published_at <= now()->toDateTimeString()) {
            return true;
        } else {
            return false;
        }
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

        return sprintf('%d %s read', $minutes, Str::plural('min', $minutes));
    }

    /**
     * Get the 10 most popular reading times rounded to the nearest 30 minutes.
     *
     * @return array
     */
    public function getPopularReadingTimesAttribute(): array
    {
        // Get the views associated with the post
        $data = $this->views()->where('post_id', $this->id)->get();

        // Filter the view data to only include hours:minutes
        $collection = collect();
        $data->each(function ($item) use ($collection) {
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

        // Sort the array in a descending fashion
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
        $data->each(function ($item) use ($collection) {
            is_null($item->referer) ? $collection->push('Other') : $collection->push(parse_url($item->referer)['host']);
        });

        // Count the unique values and assign to their respective keys
        $array = array_count_values($collection->toArray());

        // Only return the top 10 referrers with their view count
        $sliced = array_slice($array, 0, 10, true);

        // Sort the array in a descending fashion
        arsort($sliced);

        return $sliced;
    }

    /**
     * Return a view count for the last 30 days.
     *
     * @return array
     */
    public function getViewTrendAttribute(): array
    {
        // Get the views associated with the post
        $data = $this->views;

        // Filter views to only include the last 30 days
        $filtered = $data->filter(function ($value) {
            return $value->created_at >= now()->subDays(30);
        });

        // Filter the view data to only include created_at time strings
        $collection = collect();
        $filtered->sortBy('created_at')->each(function ($item) use ($collection) {
            $collection->push($item->created_at->toDateString());
        });

        // Count the unique values and assign to their respective keys
        $views = array_count_values($collection->toArray());

        // Create a 30 day range to hold the default date values
        $period = CarbonPeriod::create(now()->subDays(30)->toDateString(), 30)->excludeStartDate();

        // Prep the array to perform a comparison with the actual view data
        $range = collect();
        /** @var Carbon $date */
        foreach ($period as $key => $date) {
            $range->push($date->toDateString());
        }

        // Compare the view data and date range arrays, assigning view counts where applicable
        $total = collect();
        foreach ($range as $date) {
            if (array_key_exists($date, $views)) {
                $total->put($date, $views[$date]);
            } else {
                $total->put($date, 0);
            }
        }

        return $total->toArray();
    }

    /**
     * Scope a query to only include published posts.
     *
     * @param Builder $query
     *
     * @return Builder
     */
    public function scopePublished($query): Builder
    {
        return $query->where('published_at', '<=', now()->toDateTimeString());
    }
}
