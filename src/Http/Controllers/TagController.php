<?php

namespace Canvas\Http\Controllers;

use Canvas\Tag;
use Ramsey\Uuid\Uuid;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class TagController extends Controller
{
    /**
     * Get all the tags.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'tags' => Tag::orderByDesc('created_at')->withCount('posts')->get(),
        ]);
    }

    /**
     * Get a single tag or return a UUID to create one.
     *
     * @param null $id
     * @return JsonResponse
     * @throws \Exception
     */
    public function show($id = null): JsonResponse
    {
        if ($id === 'create') {
            return response()->json([
                'tag' => Tag::make([
                    'id' => Uuid::uuid4(),
                ]),
            ]);
        } else {
            return response()->json([
                'tag' => Tag::find($id),
            ]);
        }
    }

    /**
     * Create or update a tag.
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
            'slug' => Rule::unique('canvas_tags', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ], $messages)->validate();

        $tag = $id !== 'create' ? Tag::find($id) : new Tag(['id' => request('id')]);

        $tag->fill($data);
        $tag->save();

        return response()->json([
            'tag' => $tag->refresh(),
        ]);
    }

    /**
     * Delete a tag.
     *
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        $tag = Tag::find($id);

        if ($tag) {
            $tag->delete();
        }

        return response()->json([$tag]);
    }
}
