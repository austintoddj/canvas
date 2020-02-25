<?php

namespace Canvas\Http\Controllers;

use Canvas\Topic;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Ramsey\Uuid\Uuid;

class TopicController extends Controller
{
    /**
     * Get all the topics.
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
     * Get a single topic or return a UUID to create one.
     *
     * @param null $id
     * @return JsonResponse
     * @throws Exception
     */
    public function show($id = null): JsonResponse
    {
        if (Topic::forCurrentUser()->pluck('id')->contains($id) || $this->isNewTopic($id)) {
            if ($this->isNewTopic($id)) {
                return response()->json(Topic::make([
                    'id' => Uuid::uuid4(),
                ]), 200);
            } else {
                $topic = Topic::find($id);

                if ($topic) {
                    return response()->json($topic, 200);
                } else {
                    return response()->json(null, 301);
                }
            }
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

        if ($id !== 'create') {
            $topic = Topic::find($id);
        } else {
            if ($topic = Topic::onlyTrashed()->where('slug', request('slug'))->first()) {
                $topic->restore();
            } else {
                $topic = new Topic(['id' => request('id')]);
            }
        }

        $topic->fill($data);
        $topic->save();

        return response()->json($topic->refresh(), 201);
    }

    /**
     * Delete a topic.
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
        }
    }

    /**
     * Return true if we're creating a new topic.
     *
     * @param string $id
     * @return bool
     */
    private function isNewTopic(string $id): bool
    {
        return $id === 'create';
    }
}
