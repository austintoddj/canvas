<?php

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\TopicRequest;
use Canvas\Models\Topic;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Ramsey\Uuid\Uuid;

class TopicController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
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
     *
     * @return JsonResponse
     */
    public function create(): JsonResponse
    {
        return response()->json(Topic::query()->make([
            'id' => Uuid::uuid4()->toString(),
        ]), 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  TopicRequest  $request
     * @param  $id
     * @return JsonResponse
     */
    public function store(TopicRequest $request, $id): JsonResponse
    {
        $data = $request->validated();

        $topic = Topic::query()->find($id);

        if (! $topic) {
            if ($topic = Topic::onlyTrashed()->firstWhere('slug', $data['slug'])) {
                $topic->restore();

                return response()->json($topic->refresh(), 201);
            } else {
                $topic = new Topic(['id' => $id]);
            }
        }

        $topic->fill($data);

        $topic->user_id = $topic->user_id ?? request()->user('canvas')->id;

        $topic->save();

        return response()->json($topic->refresh(), 201);
    }

    /**
     * Display the specified resource.
     *
     * @param  $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        $topic = Topic::query()->findOrFail($id);

        return response()->json($topic, 200);
    }

    /**
     * Display the specified relationship.
     *
     * @param  $id
     * @return JsonResponse
     */
    public function posts($id): JsonResponse
    {
        $topic = Topic::query()->with('posts')->findOrFail($id);

        return response()->json($topic->posts()->withCount('views')->paginate(), 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  $id
     * @return mixed
     *
     * @throws Exception
     */
    public function destroy($id)
    {
        $topic = Topic::query()->findOrFail($id);

        $topic->delete();

        return response()->json(null, 204);
    }
}
