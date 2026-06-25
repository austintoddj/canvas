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
            ->when(! $canViewAllPosts, fn (Builder $query) => $query->where('user_id', $user->id))
            ->latest()
            ->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'name' => $post->title,
                'title' => $post->title,
                'type' => 'Post',
                'route' => 'edit-post',
            ]);

        return response()->json($posts->toArray(), 200);
    }

    /**
     * Display the specified resource.
     */
    public function tags(): JsonResponse
    {
        $tags = Tag::query()
            ->select('id', 'name')
            ->latest()
            ->get()
            ->map(fn (Tag $tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'type' => 'Tag',
                'route' => 'edit-tag',
            ]);

        return response()->json($tags->toArray(), 200);
    }

    /**
     * Display the specified resource.
     */
    public function topics(): JsonResponse
    {
        $topics = Topic::query()
            ->select('id', 'name')
            ->latest()
            ->get()
            ->map(fn (Topic $topic) => [
                'id' => $topic->id,
                'name' => $topic->name,
                'type' => 'Topic',
                'route' => 'edit-topic',
            ]);

        return response()->json($topics->toArray(), 200);
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
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'type' => 'User',
                'route' => 'edit-user',
            ]);

        return response()->json($users->toArray(), 200);
    }
}
