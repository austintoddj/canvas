<?php

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\StoreTopicRequest;
use Canvas\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Ramsey\Uuid\Uuid;

class TopicController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            Topic::latest()
                 ->withCount('posts')
                 ->paginate(), 200
        );
    }

    /**
     * Show the form for creating a new resource.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function create(Request $request): JsonResponse
    {
        return response()->json(Topic::make([
            'id' => Uuid::uuid4()->toString(),
        ]), 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreTopicRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function store(StoreTopicRequest $request, $id): JsonResponse
    {
        $data = $request->validated();

        $tag = Topic::find($id);

        if (! $tag) {
            if ($tag = Topic::onlyTrashed()->firstWhere('slug', $data['slug'])) {
                $tag->restore();

                return response()->json($tag->refresh(), 201);
            } else {
                $tag = new Topic(['id' => $id]);
            }
        }

        $tag->fill($data);

        $tag->user_id = request()->user('canvas')->id;

        $tag->save();

        return response()->json($tag->refresh(), 201);
    }

    /**
     * Display the specified resource.
     *
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function show(Request $request, $id): JsonResponse
    {
        $topic = Topic::find($id);

        return $topic ? response()->json($topic, 200) : response()->json(null, 404);
    }

    /**
     * Display the specified relationship.
     *
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function showPosts(Request $request, $id): JsonResponse
    {
        $topic = Topic::with('posts')->find($id);

        return $topic ? response()->json($topic->posts()->withCount('views')->paginate(), 200) : response()->json(null, 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param Request $request
     * @param $id
     * @return mixed
     */
    public function destroy(Request $request, $id)
    {
        $topic = Topic::findOrFail($id);

        $topic->delete();

        return response()->json(null, 204);
    }
}
