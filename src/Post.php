<?php

namespace Canvas;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Foundation\Auth\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Nicolaslopezj\Searchable\SearchableTrait;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Post extends Model
{
    use SoftDeletes, SearchableTrait;

    /**
     * Searchable rules.
     *
     * @var array
     */
    protected $searchable = [
        /**
         * Columns and their priority in search results.
         * Columns with higher values are more important.
         * Columns with equal values have equal importance.
         *
         * @var array
         */
        'columns' => [
            'canvas_posts.title' => 10,
            'canvas_posts.summary' => 5,
        ],
    ];

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
     * The tags the post belongs to.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'canvas_posts_tags', 'post_id', 'tag_id');
    }

    /**
     * The user who published the post.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The views belonging to the post.
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
     * @param $value
     * @return User
     */
    public function getAuthorAttribute($value): User
    {
        return User::find($this->user_id);
    }

    /**
     * Check to see if the post is published.
     *
     * @param $value
     * @return bool
     */
    public function getPublishedAttribute($value): bool
    {
        if ($this->published_at <= now()->toDateTimeString()) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Get the human-friendly reading time of a post.
     *
     * @param $value
     * @return string
     */
    public function getReadTimeAttribute($value): string
    {
        $words = str_word_count(strip_tags($this->body));
        $minutes = ceil($words / 200);

        return sprintf('%s %s %s', $minutes, str_plural(' min', $minutes), ' read');
    }

    /**
     * Get the 10 most popular reading times rounded to the nearest 30 minutes.
     *
     * @param $value
     * @return array
     */
    public function getPopularReadingTimesAttribute($value): array
    {
        $data = View::where('post_id', $this->id)->get();

        $collection = collect();
        $data->each(function ($item, $key) use ($collection) {
            $collection->push($item->created_at->minute(0)->format('H:i'));
        });

        $filtered = array_count_values($collection->toArray());
        $popular_reading_times = collect();

        foreach ($filtered as $key => $value) {
            $start_time = Carbon::createFromTimeString($key);
            $end_time = $start_time->copy()->addMinutes(60);

            $percentage = round($value / $data->count() * 100);
            $popular_reading_times->put(sprintf('%s - %s', $start_time->format('g:i A'), $end_time->format('g:i A')), $percentage);
        }

        $array = $popular_reading_times->toArray();
        $sorted = array_slice($array, 0, 5, true);
        arsort($sorted);

        return $sorted;
    }

    /**
     * Get the top 10 referring websites for a post.
     *
     * @param $value
     * @return array
     */
    public function getTopReferersAttribute($value): array
    {
        $data = $this->views;

        $collection = collect();
        $data->each(function ($item, $key) use ($collection) {
            is_null($item->referer) ? $collection->push('Other') : $collection->push(parse_url($item->referer)['host']);
        });

        $array = array_count_values($collection->toArray());
        $sorted = array_slice($array, 0, 10, true);
        arsort($sorted);

        return $sorted;
    }

    /**
     * Return a view count for the last 30 days.
     *
     * @param $value
     * @return array
     */
    public function getViewTrendAttribute($value): array
    {
        $data = $this->views;

        $filtered = $data->filter(function ($value, $key) {
            return $value->created_at >= now()->subDays(30);
        });

        $collection = collect();
        $filtered->sortBy('created_at')->each(function ($item, $key) use ($collection) {
            $collection->push($item->created_at->toDateString());
        });

        $views = array_count_values($collection->toArray());

        $period = CarbonPeriod::create(now()->subDays(30)->toDateString(), 30)->excludeStartDate();

        $range = collect();
        foreach ($period as $key => $date) {
            $range->push($date->toDateString());
        }

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
     * @return Builder
     */
    public function scopePublished($query): Builder
    {
        return $query->where('published_at', '<=', now()->toDateTimeString());
    }
}
