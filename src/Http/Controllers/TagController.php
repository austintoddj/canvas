<?php

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\TagRequest;
use Canvas\Models\Tag;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Ramsey\Uuid\Uuid;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return response()->json(
            Tag::query()
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
        return response()->json(Tag::query()->make([
            'id' => Uuid::uuid4()->toString(),
        ]), 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  TagRequest  $request
     * @param  $id
     * @return JsonResponse
     */
    public function store(TagRequest $request, $id): JsonResponse
    {
        $data = $request->validated();

        $tag = Tag::query()->find($id);

        if (! $tag) {
            if ($tag = Tag::onlyTrashed()->firstWhere('slug', $data['slug'])) {
                $tag->restore();

                return response()->json($tag->refresh(), 201);
            } else {
                $tag = new Tag(['id' => $id]);
            }
        }

        $tag->fill($data);

        $tag->user_id = $tag->user_id ?? request()->user('canvas')->id;

        $tag->save();

        return response()->json($tag->refresh(), 201);
    }

    /**
     * Display the specified resource.
     *
     * @param  $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        $tag = Tag::query()->findOrFail($id);

        return response()->json($tag, 200);
    }

    /**
     * Display the specified relationship.
     *
     * @param  $id
     * @return JsonResponse
     */
    public function posts($id): JsonResponse
    {
        $tag = Tag::query()->with('posts')->findOrFail($id);

        return response()->json($tag->posts()->withCount('views')->paginate(), 200);
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
        $tag = Tag::query()->findOrFail($id);

        $tag->delete();

        return response()->json(null, 204);
    }
}
