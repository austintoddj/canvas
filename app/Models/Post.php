<?php

namespace App\Models;

use Carbon\Carbon;
use App\Services\Parsedowner;
use TeamTNT\TNTSearch\TNTSearch;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'subtitle',
        'content_raw',
        'page_image',
        'meta_description',
        'layout',
        'is_draft',
        'published_at',
        'slug',
    ];

    protected $casts = [
        'title'            => 'string',
        'subtitle'         => 'string',
        'content_raw'      => 'string',
        'page_image'       => 'string',
        'meta_description' => 'string',
        'layout'           => 'string',
        'is_draft'         => 'bool',
        'published_at'     => 'datetime',
        'slug'             => 'string',
    ];

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
        $params = array_only([
            'id'    => $this->id,
            'slug'  => $this->slug,
            'year'  => $this->published_at->format('Y'),
            'month' => $this->published_at->format('m'),
            'day'   => $this->published_at->format('d'),
        ], config('blog.post_params'));

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

    public static function insertToIndex($model)
    {
        $tnt = new TNTSearch;
        $tnt->loadConfig(config('services.tntsearch'));
        $tnt->selectIndex('posts.index');
        $index = $tnt->getIndex();
        $index->insert($model->toArray());
    }

    public static function deleteFromIndex($model)
    {
        $tnt = new TNTSearch;
        $tnt->loadConfig(config('services.tntsearch'));
        $tnt->selectIndex('posts.index');
        $index = $tnt->getIndex();
        $index->delete($model->id);
    }

    public static function updateIndex($model)
    {
        $tnt = new TNTSearch;
        $tnt->loadConfig(config('services.tntsearch'));
        $tnt->selectIndex('posts.index');
        $index = $tnt->getIndex();
        $index->update($model->id, $model->toArray());
    }

    public static function boot()
    {
        if (file_exists(config('services.tntsearch.storage').'/posts.index')
            && app('env') != 'testing') {
            self::created([__CLASS__, 'insertToIndex']);
            self::updated([__CLASS__, 'updateIndex']);
            self::deleted([__CLASS__, 'deleteFromIndex']);
        }
    }
}
