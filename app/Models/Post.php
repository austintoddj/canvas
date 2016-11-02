<?php

namespace App\Models;

use Carbon\Carbon;
use App\Services\Parsedowner;
use Laravel\Scout\Searchable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Post extends Model
{
    use Searchable;

    /**
     * The attributes that should be mutated to dates.
     *
     * @var array
     */
    protected $dates = ['published_at'];

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title', 'subtitle', 'content_raw', 'page_image', 'meta_description',
        'layout', 'is_draft', 'published_at', 'slug',
    ];

    /**
     * Searchable items.
     *
     * @var array
     */
    public $searchable = ['title', 'subtitle', 'content_raw', 'meta_description'];

    /**
     * get author of this post
     * 
     * @return BelongsTo
     */
    public function author()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * add Author to post
     * 
     * @param Post $post
     */
    public function addAuthor(User $author)
    {
        return $this->author()->associate($author);
    }

    /**
     * Get the tags relationship.
     *
     * @return BelongsToMany
     */
    public function tags()
    {
        return $this->belongsToMany(Tag::class)->withTimestamps();
    }

    /**
     * Set the HTML content automatically when the raw content is set.
     *
     * @param string $value
     */
    public function setContentRawAttribute($value)
    {
        $markdown = new Parsedowner();
        $this->attributes['content_raw'] = $value;
        $this->attributes['content_html'] = $markdown->toHTML($value);
    }

    /**
     * Sync tag relationships and add new tags as needed.
     *
     * @param array $tags
     */
    public function syncTags(array $tags)
    {
        Tag::addNeededTags($tags);
        if (count($tags)) {
            $this->tags()->sync(
                Tag::whereIn('tag', $tags)->pluck('id')->all()
            );

            return;
        }
        $this->tags()->detach();
    }

    /**
     * Get the raw content attribute.
     *
     * @param $value
     *
     * @return Carbon|\Illuminate\Support\Collection|int|mixed|static
     */
    public function getContentAttribute($value)
    {
        return $this->content_raw;
    }

    /**
     * Return URL to post.
     *
     * @param Tag $tag
     * @return string
     */
    public function url(Tag $tag = null)
    {
        $params = [];
        $params['slug'] = $this->slug;
        $params['tag'] = $tag ? $tag->tag : null;

        return route('blog.post.show', array_filter($params));
    }

    /**
     * Return an array of tag links.
     *
     * @return array
     */
    public function tagLinks()
    {
        $tags = $this->tags()->pluck('tag');
        $return = [];
        foreach ($tags as $tag) {
            $url = route('blog.post.index', ['tag' => $tag]);
            $return[] = '<a href="'.url($url).'">'.e($tag).'</a>';
        }

        return $return;
    }

    /**
     * Return next post after this one or null.
     *
     * @param Tag $tag
     * @return Post
     */
    public function newerPost(Tag $tag = null)
    {
        $query =
        static::where('published_at', '>', $this->published_at)
            ->where('published_at', '<=', Carbon::now())
            ->where('is_draft', 0)
            ->orderBy('published_at', 'asc');
        if ($tag) {
            $query = $query->whereHas('tags', function ($q) use ($tag) {
                $q->where('tag', '=', $tag->tag);
            });
        }

        return $query->first();
    }

    /**
     * Return older post before this one or null.
     *
     * @param Tag $tag
     * @return Post
     */
    public function olderPost(Tag $tag = null)
    {
        $query =
        static::where('published_at', '<', $this->published_at)
            ->where('is_draft', 0)
            ->orderBy('published_at', 'desc');
        if ($tag) {
            $query = $query->whereHas('tags', function ($q) use ($tag) {
                $q->where('tag', '=', $tag->tag);
            });
        }

        return $query->first();
    }

    /**
     * Return an approximate reading time for the post. Based on reading time of 275 WPM.
     *
     * @return int
     */
    public function readingTime()
    {
        return round(str_word_count($this->content_raw) / 275);
    }
}
