<?php

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\StoreTopic;
use Canvas\Topic;
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
            Topic::forCurrentUser()
                 ->latest()
                 ->withCount('posts')
                 ->paginate(), 200
        );
    }

    /**
     * Display the specified resource.
     *
     * @param $id
     * @return JsonResponse
     * @throws Exception
     */
    public function show($id): JsonResponse
    {
        if ($this->isNewTopic($id)) {
            return response()->json(Topic::make([
                'id' => Uuid::uuid4()->toString(),
            ]), 200);
        } else {
            $topic = Topic::forCurrentUser()->find($id);

            return $topic ? response()->json($topic, 200) : response()->json(null, 404);
        }
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreTopic $request
     * @param $id
     * @return JsonResponse
     */
    public function store(StoreTopic $request, $id): JsonResponse
    {
        $topic = Topic::forCurrentUser()->find($id);

        if (! $topic) {
            if ($tag = Topic::forCurrentUser()->onlyTrashed()->where('slug', $request->slug)->first()) {
                $tag->restore();
            } else {
                $topic = new Topic(['id' => $id]);
            }
        }

        $topic->fill([
            'id' => $id,
            'name' => $request->name,
            'slug' => $request->slug,
            'user_id' => request()->user()->id,
        ]);

        $topic->save();

        return response()->json($topic->refresh(), 201);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param $id
     * @return mixed
     */
    public function destroy($id)
    {
        $topic = Topic::forCurrentUser()->find($id);

        if ($topic) {
            $topic->delete();

            return response()->json(null, 204);
        } else {
            return response()->json(null, 404);
        }
    }

    /**
     * Return true if the given ID is for a new topic.
     *
     * @param $id
     * @return bool
     */
    private function isNewTopic($id): bool
    {
        return $id === 'create';
    }
}
