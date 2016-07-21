<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
TeamTNT\TNTSearch\TNTSearch;

class Tag extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'tag', 'title', 'subtitle', 'meta_description',
        'reverse_direction', 'created_at', 'updated_at',
    ];

    /**
     * Get the posts relationship.
     *
     * @return BelongsToMany
     */
    public function posts()
    {
        return $this->belongsToMany('App\Post', 'post_tag_pivot');
    }

    /**
     * Add tags from the list.
     *
     * @param array $tags List of tags to check/add
     */
    public static function addNeededTags(array $tags)
    {
        if (count($tags) === 0) {
            return;
        }
        $found = static::whereIn('tag', $tags)->lists('tag')->all();
        foreach (array_diff($tags, $found) as $tag) {
            static::create([
                'tag' => $tag,
                'title' => $tag,
                'subtitle' => 'Subtitle for ' . $tag,
                'meta_description' => '',
                'reverse_direction' => false,
            ]);
        }
    }

    /**
     * Return the index layout to use for a tag.
     *
     * @param string $tag
     * @param string $default
     * @return string
     */
    public static function layout($tag, $default = 'blog.layouts.index')
    {
        $layout = static::whereTag($tag)->pluck('layout');
        return $layout ?: $default;
    }

    public static function insertToIndex($model)
    {
        $tnt = new TNTSearch;
        $tnt->loadConfig(config('services.tntsearch'));
        $tnt->selectIndex("tags.index");
        $index = $tnt->getIndex();
        $index->insert($model->toArray());
    }

    public static function deleteFromIndex($model)
    {
        $tnt = new TNTSearch;
        $tnt->loadConfig(config('services.tntsearch'));
        $tnt->selectIndex("tags.index");
        $index = $tnt->getIndex();
        $index->delete($model->id);
    }

    public static function updateIndex($model)
    {
        $tnt = new TNTSearch;
        $tnt->loadConfig(config('services.tntsearch'));
        $tnt->selectIndex("tags.index");
        $index = $tnt->getIndex();
        $index->update($model->id, $model->toArray());
    }

    public static function boot()
    {
        if (file_exists(config('services.tntsearch.storage') . '/tags.index')
            && app('env') != 'testing') {
            self::created([__CLASS__, 'insertToIndex']);
            self::updated([__CLASS__, 'updateIndex']);
            self::deleted([__CLASS__, 'deleteFromIndex']);
        }
    }
}
