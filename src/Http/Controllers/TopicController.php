<?php

namespace Canvas\Http\Controllers;

use Canvas\Topic;
use Ramsey\Uuid\Uuid;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class TopicController extends Controller
{
    /**
     * Get all the topics.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'topics' => Topic::orderByDesc('created_at')->withCount('posts')->get(),
        ]);
    }

    /**
     * Get a single topic or return a UUID to create one.
     *
     * @param null $id
     * @return JsonResponse
     * @throws \Exception
     */
    public function show($id = null): JsonResponse
    {
        if ($id === 'create') {
            return response()->json([
                'topic' => Topic::make([
                    'id' => Uuid::uuid4(),
                ]),
            ]);
        } else {
            return response()->json([
                'topic' => Topic::find($id),
            ]);
        }
    }

    /**
     * Create or update a topic.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function store(string $id): JsonResponse
    {
        $data = [
            'id'   => request('id'),
            'name' => request('name'),
            'slug' => request('slug'),
        ];

        $messages = [
            'required' => __('canvas::validation.required'),
            'unique'   => __('canvas::validation.unique'),
        ];

        validator($data, [
            'name' => 'required',
            'slug' => Rule::unique('canvas_topics', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ], $messages)->validate();

        $topic = $id !== 'create' ? Topic::find($id) : new Topic(['id' => request('id')]);

        $topic->fill($data);
        $topic->save();

        return response()->json([
            'topic' => $topic->refresh(),
        ]);
    }

    /**
     * Delete a topic.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        $topic = Topic::find($id);

        if ($topic) {
            $topic->delete();
        }

        return response()->json([$topic]);
    }
}
