<?php
namespace App\Models;

use App\Services\Parsedowner;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use TeamTNT\TNTSearch\TNTSearch;

class Post extends Model
{
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
     * Get the tags relationship.
     *
     * @return BelongsToMany
     */
    public function tags()
    {
        return $this->belongsToMany('App\Models\Tag', 'post_tag_pivot');
    }

    /**
     * Set the HTML content automatically when the raw content is set.
     *
     * @param string $value
     */
    public function setContentRawAttribute($value)
    {
        $markdown                         = new Parsedowner();
        $this->attributes['content_raw']  = $value;
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
                Tag::whereIn('tag', $tags)->lists('id')->all()
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
        $url = url('blog/' . $this->slug);
        if ($tag) {
            $url .= '?tag=' . urlencode($tag->tag);
        }
        return $url;
    }

    /**
     * Return an array of tag links.
     *
     * @param string $base
     * @return array
     */
    public function tagLinks($base = '/blog?tag=%TAG%')
    {
        $tags   = $this->tags()->lists('tag');
        $return = [];
        foreach ($tags as $tag) {
            $url      = str_replace('%TAG%', urlencode($tag), $base);
            $return[] = '<a href="' . url($url) . '">' . e($tag) . '</a>';
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
        $tnt->selectIndex("posts.index");
        $index = $tnt->getIndex();
        $index->insert($model->toArray());
    }

    public static function deleteFromIndex($model)
    {
        $tnt = new TNTSearch;
        $tnt->loadConfig(config('services.tntsearch'));
        $tnt->selectIndex("posts.index");
        $index = $tnt->getIndex();
        $index->delete($model->id);
    }

    public static function updateIndex($model)
    {
        $tnt = new TNTSearch;
        $tnt->loadConfig(config('services.tntsearch'));
        $tnt->selectIndex("posts.index");
        $index = $tnt->getIndex();
        $index->update($model->id, $model->toArray());
    }

    public static function boot()
    {
        if (file_exists(config('services.tntsearch.storage') . '/posts.index')
            && app('env') != 'testing') {
            self::created([__CLASS__, 'insertToIndex']);
            self::updated([__CLASS__, 'updateIndex']);
            self::deleted([__CLASS__, 'deleteFromIndex']);
        }
    }
}
