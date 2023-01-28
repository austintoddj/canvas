<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\StoreTopicRequest;
use Canvas\Models\Topic;
use Exception;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Routing\Controller;

class TopicController extends Controller
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
            Topic::query()
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
     * @param  StoreTopicRequest  $request
     * @return void
     */
    public function store(StoreTopicRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        $topic = Topic::query()->findOrFail($id);

        return response()->json($topic);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Canvas\Http\Requests\StoreTopicRequest  $request
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(StoreTopicRequest $request, string $id)
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
     * Display the specified relationship.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function posts(string $id)
    {
        $topic = Topic::query()->with('posts')->findOrFail($id);

        return response()->json($topic->posts()->withCount('views')->paginate());
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
        $topic = Topic::query()->findOrFail($id);

        $topic->delete();

        return response()->json(null, 204);
    }
}
