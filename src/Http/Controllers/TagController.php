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
        $filterByPopular = request()->query('usage') === 'popular';
        $filterByUnpopular = request()->query('usage') === 'unpopular';

        return response()->json(
            Tag::query()
                ->select('id', 'name', 'created_at')
                ->withCount('posts')
                ->when($filterByPopular, function (Builder $query) {
                    return $query->orderBy('posts_count', 'desc');
                })
                ->when($filterByUnpopular, function (Builder $query) {
                    return $query->orderBy('posts_count', 'asc');
                })
                ->when($sortAscending, function (Builder $query) {
                    return $query->oldest();
                }, function (Builder $query) {
                    return $query->latest();
                })
               ->paginate()
        );
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  StoreTagRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(StoreTagRequest $request)
    {
        $tag = Tag::query()->create([
            'id' => Uuid::uuid4()->toString(),
            ...$request->validated(),
        ]);

        return response()->json($tag->refresh());
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
     * Update the specified resource in storage.
     *
     * @param  \Canvas\Http\Requests\StoreTagRequest  $request
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(StoreTagRequest $request, string $id)
    {
        $data = $request->validated();

        $tag = Tag::withTrashed()->find($id);

        if ($tag->trashed()) {
            $tag->restore();

            return response()->json($tag->refresh());
        }

        $tag->update($data);

        return response()->json($tag->refresh());
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
