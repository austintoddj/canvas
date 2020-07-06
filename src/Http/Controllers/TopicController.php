<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Topic;
use Exception;
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
            Topic::latest()
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
        if ($id === 'create') {
            return response()->json(Topic::make([
                'id' => Uuid::uuid4()->toString(),
            ]), 200);
        } else {
            $topic = Topic::find($id);

            return $topic ? response()->json($topic, 200) : response()->json(null, 404);
        }
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param $id
     * @return JsonResponse
     */
    public function store($id): JsonResponse
    {
        $topic = Topic::find($id);

        if (! $topic) {
            if ($topic = Topic::onlyTrashed()->where('slug', request('slug'))->first()) {
                $topic->restore();
            } else {
                $topic = new Topic(['id' => $id]);
            }
        }

        $data = [
            'id' => $id,
            'name' => request('name'),
            'slug' => request('slug'),
            'user_id' => request()->user()->id,
        ];

        $rules = [
            'name' => 'required',
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_topics')->where(function ($query) use ($data) {
                    return $query->where('slug', $data['slug'])->where('user_id', $data['user_id']);
                })->ignore($id)->whereNull('deleted_at'),
            ],
        ];

        $messages = [
            'required' => __('canvas::app.validation_required', [], optional($topic->userMeta)->locale),
            'unique' => __('canvas::app.validation_unique', [], optional($topic->userMeta)->locale),
        ];

        validator($data, $rules, $messages)->validate();

        $topic->fill($data);

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
        $topic = Topic::findOrFail($id);

        $topic->delete();

        return response()->json(null, 204);
    }
}
