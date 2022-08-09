<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\StoreTagRequest;
use Canvas\Models\Tag;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Routing\Controller;
use Ramsey\Uuid\Uuid;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $sortAscending = request()->query('sort', 'desc') === 'asc';

        return response()->json(
            Tag::query()
               ->select('id', 'name', 'created_at')
                ->when($sortAscending, function (Builder $query) {
                    return $query->oldest();
                }, function (Builder $query) {
                    return $query->latest();
                })
               ->withCount('posts')
               ->paginate()
        );
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function create()
    {
        return response()->json(Tag::query()->make([
            'id' => Uuid::uuid4()->toString(),
        ]));
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Canvas\Http\Requests\StoreTagRequest  $request
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreTagRequest $request, string $id)
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
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        $tag = Tag::query()->findOrFail($id);

        return response()->json($tag);
    }

    /**
     * Display the specified relationship.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function posts(string $id)
    {
        $tag = Tag::query()->with('posts')->findOrFail($id);

        return response()->json($tag->posts()->withCount('views')->paginate());
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     *
     * @throws Exception
     */
    public function destroy(string $id)
    {
        $tag = Tag::query()->findOrFail($id);

        $tag->delete();

        return response()->json(null, 204);
    }
}
