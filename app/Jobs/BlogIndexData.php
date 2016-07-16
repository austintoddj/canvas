<?php
namespace App\Jobs;

use Carbon\Carbon;
use App\Models\Tag;
use App\Models\Post;
use Illuminate\Contracts\Bus\SelfHandling;

class BlogIndexData extends Job implements SelfHandling
{
    protected $tag;
    protected $search;


    /**
     * BlogIndexData constructor.
     *
     * @param $tag
     * @param null $search
     */
    public function __construct($tag, $search = null)
    {
        $this->tag = $tag;
        $this->search = $search;
    }

    /**
     * Execute the command.
     *
     * @return array
     */
    public function handle()
    {
        if ($this->tag) {
            return $this->tagIndexData($this->tag);
        }
        return $this->normalIndexData();
    }

    /**
     * Return data for normal index page
     *
     * @return array
     */
    protected function normalIndexData()
    {
        $posts = Post::with('tags')
            ->where('published_at', '<=', Carbon::now())
            ->where('is_draft', 0)
            ->orderBy('published_at', 'desc');
        
            if($this->search !== null) {
                $posts = $posts->where('content_raw', 'LIKE', '%' . html_entity_decode($this->search) . '%');
            }

            $posts = $posts->simplePaginate(config('blog.posts_per_page'));
        
        return [
            'title' => config('blog.title'),
            'subtitle' => config('blog.subtitle'),
            'posts' => $posts,
            'page_image' => config('blog.page_image'),
            'meta_description' => config('blog.description'),
            'reverse_direction' => false,
            'tag' => null,
        ];
    }

    /**
     * Return data for a tag index page
     *
     * @param string $tag
     * @return array
     */
    protected function tagIndexData($tag)
    {
        $tag = Tag::where('tag', $tag)->firstOrFail();

        $reverse_direction = (bool)$tag->reverse_direction;

        $posts = Post::where('published_at', '<=', Carbon::now())
            ->whereHas('tags', function ($q) use ($tag) {
                $q->where('tag', '=', $tag->tag);
            })
            ->where('is_draft', 0)
            ->orderBy('published_at', $reverse_direction ? 'asc' : 'desc')
            ->simplePaginate(config('blog.posts_per_page'));

        $posts->addQuery('tag', $tag->tag);

        $page_image = $tag->page_image ?: config('blog.page_image');
        
        return [
            'title' => $tag->title,
            'subtitle' => $tag->subtitle,
            'posts' => $posts,
            'page_image' => $page_image,
            'tag' => $tag,
            'reverse_direction' => $reverse_direction,
            'meta_description' => $tag->meta_description ?: \
                config('blog.description'),
        ];
    }
}