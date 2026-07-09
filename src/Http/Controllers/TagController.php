<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\TagRequest;
use Canvas\Models\Tag;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
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
     */
    public function create(): JsonResponse
    {
        return response()->json(Tag::query()->make([
            'id' => (string) Str::uuid(),
        ]), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TagRequest $request, string $id): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user(config('canvas.guard'));

        $tag = Tag::query()->find($id);
        $created = $tag === null;

        if (! $tag) {
            if ($tag = Tag::onlyTrashed()->firstWhere('slug', $data['slug'])) {
                $tag->restore();
                $tag->fill($data);
                $tag->save();

                return response()->json($tag->refresh(), 201);
            }

            $tag = new Tag(['id' => $id]);
        }

        $tag->fill($data);
        $tag->user_id = $tag->user_id ?? $user->id;
        $tag->save();

        return response()->json($tag->refresh(), $created ? 201 : 200);
    }

    /**
     * Display the specified resource.
     */
    public function show(Tag $tag): JsonResponse
    {
        return response()->json($tag, 200);
    }

    /**
     * Display the specified relationship.
     */
    public function posts(Tag $tag): JsonResponse
    {
        return response()->json($tag->posts()->withCount('views')->paginate(), 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return mixed
     *
     * @throws Exception
     */
    public function destroy(Tag $tag)
    {

        $tag->delete();

        return response()->json(null, 204);
    }
}
