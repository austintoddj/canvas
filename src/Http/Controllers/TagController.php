<?php

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\StoreTagRequest;
use Canvas\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Ramsey\Uuid\Uuid;

class TagController extends Controller
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
            Tag::latest()
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
        return response()->json(Tag::make([
            'id' => Uuid::uuid4()->toString(),
        ]), 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreTagRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function store(StoreTagRequest $request, $id): JsonResponse
    {
        $data = $request->validated();

        $tag = Tag::find($id);

        if (! $tag) {
            if ($tag = Tag::onlyTrashed()->firstWhere('slug', $data['slug'])) {
                $tag->restore();

                return response()->json($tag->refresh(), 201);
            } else {
                $tag = new Tag(['id' => $id]);
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
        $tag = Tag::find($id);

        return $tag ? response()->json($tag, 200) : response()->json(null, 404);
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
        $tag = Tag::with('posts')->find($id);

        return $tag ? response()->json($tag->posts()->withCount('views')->paginate(), 200) : response()->json(null, 200);
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
        $tag = Tag::findOrFail($id);

        $tag->delete();

        return response()->json(null, 204);
    }
}
