<?php

namespace Canvas\Http\Controllers;

use Exception;
use Canvas\Tag;
use Canvas\Post;
use Canvas\Topic;
use Ramsey\Uuid\Uuid;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class PostController extends Controller
{
    /**
     * Get all the posts.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return response()->json(Post::forUser(request()->user()->id)
            ->orderByDesc('created_at')
            ->get());
    }

    /**
     * Get a single post or return a UUID to create one.
     *
     * @param null $id
     * @return JsonResponse
     * @throws Exception
     */
    public function show($id = null): JsonResponse
    {
        $tags = Tag::all(['name', 'slug']);
        $topics = Topic::all(['name', 'slug']);

        if ($this->isNewPost($id)) {
            $uuid = Uuid::uuid4();

            return response()->json([
                'post'   => Post::make([
                    'id'   => $uuid->toString(),
                    'slug' => "post-{$uuid->toString()}",
                ]),
                'tags'   => $tags,
                'topics' => $topics,
            ]);
        } else {
            return response()->json([
                'post'   => Post::with('tags:name,slug', 'topic:name,slug')->find($id),
                'tags'   => $tags,
                'topics' => $topics,
            ]);
        }
    }

    /**
     * Create or update a post.
     *
     * @param string $id
     * @return JsonResponse
     * @throws Exception
     */
    public function store(string $id): JsonResponse
    {
        $data = [
            'id'                     => request('id'),
            'slug'                   => request('slug'),
            'title'                  => request('title', 'Title'),
            'summary'                => request('summary', null),
            'body'                   => request('body', null),
            'published_at'           => request('published_at', null),
            'featured_image'         => request('featured_image', null),
            'featured_image_caption' => request('featured_image_caption', null),
            'user_id'                => request()->user()->id,
            'meta'                   => [
                'meta_description'    => request('meta_description', null),
                'og_title'            => request('og_title', null),
                'og_description'      => request('og_description', null),
                'twitter_title'       => request('twitter_title', null),
                'twitter_description' => request('twitter_description', null),
                'canonical_link'      => request('canonical_link', null),
            ],
        ];

        $messages = [
            'required' => __('canvas::validation.required'),
            'unique'   => __('canvas::validation.unique'),
        ];

        validator($data, [
            'user_id' => 'required',
            'slug'    => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_posts', 'slug')->ignore($id),
            ],
        ], $messages)->validate();

        $post = $id !== 'create' ? Post::find($id) : new Post(['id' => request('id')]);

        $post->fill($data);
        $post->meta = $data['meta'];
        $post->save();

        $post->topic()->sync(
            $this->syncTopic(request('topic'))
        );

        $post->tags()->sync(
            $this->syncTags(request('tags'))
        );

        return response()->json($post->refresh());
    }

    /**
     * Delete a post.
     *
     * @param string $id
     * @return void
     */
    public function destroy(string $id)
    {
        $post = Post::find($id);

        if ($post) {
            $post->delete();
        }
    }

    /**
     * Returns true if creating a new post.
     *
     * @param string $id
     * @return bool
     */
    private function isNewPost(string $id): bool
    {
        return $id === 'create';
    }

    /**
     * Attach or create a topic given an incoming array.
     *
     * @param array $incomingTopic
     * @return array
     * @throws Exception
     */
    private function syncTopic(array $incomingTopic): array
    {
        if ($incomingTopic) {
            $topic = Topic::where('slug', $incomingTopic['slug'])->first();

            if (! $topic) {
                $topic = Topic::create([
                    'id'   => $id = Uuid::uuid4(),
                    'name' => $incomingTopic['name'],
                    'slug' => $incomingTopic['slug'],
                ]);
            }

            return collect((string) $topic->id)->toArray();
        } else {
            return [];
        }
    }

    /**
     * Attach or create tags given an incoming array.
     *
     * @param array $incomingTags
     * @return array
     *
     * @author Mohamed Said <themsaid@gmail.com>
     */
    private function syncTags(array $incomingTags): array
    {
        $tags = Tag::all();

        return collect($incomingTags)->map(function ($incomingTag) use ($tags) {
            $tag = $tags->where('slug', $incomingTag['slug'])->first();

            if (! $tag) {
                $tag = Tag::create([
                    'id'   => $id = Uuid::uuid4(),
                    'name' => $incomingTag['name'],
                    'slug' => $incomingTag['slug'],
                ]);
            }

            return (string) $tag->id;
        })->toArray();
    }
}
