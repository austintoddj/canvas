<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\TopicRequest;
use Canvas\Models\Topic;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class TopicController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json(
            Topic::query()
                ->select('id', 'name', 'created_at')
                ->latest()
                ->withCount('posts')
                ->paginate(), 200
        );
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): JsonResponse
    {
        return response()->json(Topic::query()->make([
            'id' => (string) Str::uuid(),
        ]), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TopicRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user(config('canvas.guard'));

        $topic = Topic::query()->find($id);
        $created = $topic === null;

        if (! $topic) {
            if ($topic = Topic::onlyTrashed()->firstWhere('slug', $data['slug'])) {
                $topic->restore();
                $topic->fill($data);
                $topic->save();

                return response()->json($topic->refresh(), 201);
            }

            $topic = new Topic(['id' => $id]);
        }

        $topic->fill($data);
        $topic->user_id = $topic->user_id ?? $user->id;
        $topic->save();

        return response()->json($topic->refresh(), $created ? 201 : 200);
    }

    /**
     * Display the specified resource.
     */
    public function show(Topic $topic): JsonResponse
    {
        return response()->json($topic, 200);
    }

    /**
     * Display the specified relationship.
     */
    public function posts(Topic $topic): JsonResponse
    {
        return response()->json($topic->posts()->withCount('views')->paginate(), 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return mixed
     *
     * @throws Exception
     */
    public function destroy(Topic $topic)
    {

        $topic->delete();

        return response()->json(null, 204);
    }
}
