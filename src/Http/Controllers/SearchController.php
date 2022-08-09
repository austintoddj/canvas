<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Canvas\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class SearchController extends Controller
{
    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function posts()
    {
        $key = vsprintf('%s-%s-%s', [
            'posts',
            request()->user('canvas')->id,
            Post::query()->latest()->first()->updated_at->timestamp ?? 0,
        ]);

        return Cache::remember($key, now()->addHours(4), function () {
            $posts = Post::query()->select('id', 'title')
                         ->when(request()->user('canvas')->isContributor, function (Builder $query) {
                             return $query->where('user_id', request()->user('canvas')->id);
                         }, function (Builder $query) {
                             return $query;
                         })
                         ->latest()
                         ->get()
                         ->map(function ($post) {
                             $post['name'] = $post->title;
                             $post['type'] = 'Post';
                             $post['route'] = 'show-post';

                             return $post;
                         })
                         ->toArray();

            return response()->json($posts);
        });
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function tags()
    {
        $key = vsprintf('%s-%s-%s', [
            'tags',
            request()->user('canvas')->id,
            Tag::query()->latest()->first()->updated_at->timestamp ?? 0,
        ]);

        return Cache::remember($key, now()->addHours(4), function () {
            $tags = Tag::query()->select('id', 'name')
                       ->latest()
                       ->get()
                       ->map(function ($tag) {
                           $tag['type'] = 'Tag';
                           $tag['route'] = 'show-tag';

                           return $tag;
                       })
                       ->toArray();

            return response()->json($tags);
        });
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function topics()
    {
        $key = vsprintf('%s-%s-%s', [
            'topics',
            request()->user('canvas')->id,
            Topic::query()->latest()->first()->updated_at->timestamp ?? 0,
        ]);

        return Cache::remember($key, now()->addHours(4), function () {
            $topics = Topic::query()->select('id', 'name')
                           ->latest()
                           ->get()
                           ->map(function ($topic) {
                               $topic['type'] = 'Topic';
                               $topic['route'] = 'show-topic';

                               return $topic;
                           })
                           ->toArray();

            return response()->json($topics);
        });
    }

    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function users()
    {
        $key = vsprintf('%s-%s-%s', [
            'users',
            request()->user('canvas')->id,
            User::query()->latest()->first()->updated_at->timestamp ?? 0,
        ]);

        return Cache::remember($key, now()->addHours(4), function () {
            $users = User::query()->select('id', 'name')
                         ->latest()
                         ->get()
                         ->map(function ($user) {
                             $user['type'] = 'User';
                             $user['route'] = 'show-user';

                             return $user;
                         })
                         ->toArray();

            return response()->json($users);
        });
    }
}
