<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Post;
use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

class SearchController extends Controller
{
    /**
     * Display the specified resource.
     */
    public function posts(): JsonResponse
    {
        $user = request()->user(config('canvas.guard'));
        $canViewAllPosts = Gate::forUser($user)->allows('viewAll', Post::class);

        $posts = Post::query()
            ->select('id', 'title')
            ->when(! $canViewAllPosts, function (Builder $query) use ($user) {
                return $query->where('user_id', $user->id);
            }, function (Builder $query) {
                return $query;
            })
            ->latest()
            ->get();

        // TODO: Can ->map() drop into the above query?

        $posts->map(function ($post) {
            $post['name'] = $post->title;
            $post['type'] = 'Post';
            $post['route'] = 'edit-post';

            return $post;
        });

        return response()->json(collect($posts)->toArray(), 200);
    }

    /**
     * Display the specified resource.
     */
    public function tags(): JsonResponse
    {
        $tags = Tag::query()
            ->select('id', 'name')
            ->latest()
            ->get();

        $tags->map(function ($tag) {
            $tag['type'] = 'Tag';
            $tag['route'] = 'edit-tag';

            return $tag;
        });

        return response()->json(collect($tags)->toArray(), 200);
    }

    /**
     * Display the specified resource.
     */
    public function topics(): JsonResponse
    {
        $topics = Topic::query()
            ->select('id', 'name')
            ->latest()
            ->get();

        $topics->map(function ($topic) {
            $topic['type'] = 'Topic';
            $topic['route'] = 'edit-topic';

            return $topic;
        });

        return response()->json(collect($topics)->toArray(), 200);
    }

    /**
     * Display the specified resource.
     */
    public function users(): JsonResponse
    {
        $userModel = config('canvas.user_model');

        $users = $userModel::query()
            ->select('id', 'name', 'email')
            ->latest()
            ->get();

        $users->map(function ($user) {
            $user['type'] = 'User';
            $user['route'] = 'edit-user';

            return $user;
        });

        return response()->json(collect($users)->toArray(), 200);
    }
}
