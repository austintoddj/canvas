<?php

namespace Canvas\Http\Controllers;

use Canvas\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
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
     * Show the form for creating a new resource.
     *
     * @return JsonResponse
     */
    public function create()
    {
        return response()->json([
            'id' => Uuid::uuid4()->toString(),
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @return JsonResponse
     */
    public function store(): JsonResponse
    {
        $data = [
            'id' => request('id'),
            'name' => request('name'),
            'slug' => request('slug'),
            'user_id' => request()->user()->id,
        ];

        $messages = [
            'required' => __('canvas::app.validation_required'),
            'unique' => __('canvas::app.validation_unique'),
        ];

        validator($data, [
            'name' => 'required',
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_topics')->where(function ($query) use ($data) {
                    return $query->where('slug', $data['slug'])->where('user_id', $data['user_id']);
                })->whereNull('deleted_at'),
            ],
        ], $messages)->validate();

        if ($topic = Topic::onlyTrashed()->where('slug', request('slug'))->first()) {
            $topic->restore();
        } else {
            $topic = new Topic(['id' => request('id')]);
        }

        $topic->fill($data);
        $topic->save();

        return response()->json($topic->refresh(), 201);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param $id
     * @return JsonResponse
     */
    public function edit($id): JsonResponse
    {
        if (Topic::forCurrentUser()->pluck('id')->contains($id)) {
            $topic = Topic::find($id);

            if ($topic) {
                return response()->json($topic, 200);
            } else {
                return response()->json(null, 404);
            }
        }
    }

    /**
     * Update the specified resource in storage.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function update($id): JsonResponse
    {
        $data = [
            'id' => request('id'),
            'name' => request('name'),
            'slug' => request('slug'),
            'user_id' => request()->user()->id,
        ];

        $messages = [
            'required' => __('canvas::app.validation_required'),
            'unique' => __('canvas::app.validation_unique'),
        ];

        validator($data, [
            'name' => 'required',
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_topics')->where(function ($query) use ($data) {
                    return $query->where('slug', $data['slug'])->where('user_id', $data['user_id']);
                })->ignore($id)->whereNull('deleted_at'),
            ],
        ], $messages)->validate();

        $topic = Topic::find($id);

        $topic->fill($data);
        $topic->save();

        return response()->json($topic->refresh(), 201);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param string $id
     * @return mixed
     */
    public function destroy(string $id)
    {
        $topic = Topic::find($id);

        if ($topic) {
            $topic->delete();

            return response()->json([], 204);
        } else {
            return response()->json(null, 404);
        }
    }
}
