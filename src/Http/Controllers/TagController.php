<?php

namespace Canvas\Http\Controllers;

use Canvas\Tag;
use Ramsey\Uuid\Uuid;
use Illuminate\Validation\Rule;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class TagController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'tags' => Tag::orderByDesc('created_at')->withCount('posts')->get(),
        ]);
    }

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
                'tag' => Tag::findOrFail($id),
            ]);
        }
    }

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

        $tag = $id !== 'create' ? Tag::findOrFail($id) : new Tag(['id' => request('id')]);

        $tag->fill($data);
        $tag->save();

        return response()->json([
            'tag' => $tag->fresh(),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $tag = Tag::findOrFail($id);
        $tag->delete();

        return response()->json([$tag]);
    }
}
