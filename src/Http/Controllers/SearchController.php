<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Tag;
use Canvas\Models\Topic;
use Exception;
use Illuminate\Foundation\Auth\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class SearchController extends Controller
{
    /**
     * Display the specified resource.
     *
     * @return JsonResponse
     * @throws Exception
     */
    public function showPosts(): JsonResponse
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @return JsonResponse
     * @throws Exception
     */
    public function showTags(): JsonResponse
    {
        $tags = Tag::select('id', 'name')->latest()->get();

        $tags->map(function ($tag) {
            $tag['type'] = 'Tag';
            $tag['route'] = 'edit-tag';

            return $tag;
        });

        return response()->json(collect($tags)->toArray(), 200);
    }

    /**
     * Display the specified resource.
     *
     * @return JsonResponse
     * @throws Exception
     */
    public function showTopics(): JsonResponse
    {
        $topics = Topic::select('id', 'name')->latest()->get();

        $topics->map(function ($topic) {
            $topic['type'] = 'Topic';
            $topic['route'] = 'edit-topic';

            return $topic;
        });

        return response()->json(collect($topics)->toArray(), 200);
    }

    /**
     * Display the specified resource.
     *
     * @return JsonResponse
     * @throws Exception
     */
    public function showUsers(): JsonResponse
    {
        $users = resolve(config('canvas.user', User::class))->select('id', 'name')->latest()->get();

        $users->map(function ($user) {
            $user['type'] = 'User';
            $user['route'] = 'edit-user';

            return $user;
        });

        return response()->json(collect($users)->toArray(), 200);
    }
}
