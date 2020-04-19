<?php

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\StoreTag;
use Canvas\Tag;
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
            Tag::forCurrentUser()
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
        if ($this->isNewTag($id)) {
            return response()->json(Tag::make([
                'id' => Uuid::uuid4()->toString(),
            ]), 200);
        } else {
            $tag = Tag::forCurrentUser()->find($id);

            return $tag ? response()->json($tag, 200) : response()->json(null, 404);
        }
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreTag $request
     * @param $id
     * @return JsonResponse
     */
    public function store(StoreTag $request, $id): JsonResponse
    {
        $tag = Tag::forCurrentUser()->find($id);

        if (! $tag) {
            if ($tag = Tag::forCurrentUser()->onlyTrashed()->where('slug', $request->slug)->first()) {
                $tag->restore();
            } else {
                $tag = new Tag(['id' => $id]);
            }
        }

        $tag->fill([
            'id' => $id,
            'name' => $request->name,
            'slug' => $request->slug,
            'user_id' => request()->user()->id,
        ]);

        $tag->save();

        return response()->json($tag->refresh(), 201);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param $id
     * @return mixed
     */
    public function destroy($id)
    {
        $tag = Tag::forCurrentUser()->find($id);

        if ($tag) {
            $tag->delete();

            return response()->json(null, 204);
        } else {
            return response()->json(null, 404);
        }
    }

    /**
     * Return true if the given ID is for a new tag.
     *
     * @param $id
     * @return bool
     */
    private function isNewTag($id): bool
    {
        return $id === 'create';
    }
}
