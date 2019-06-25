<?php

namespace Canvas\Http\Controllers;

use Canvas\Tag;
use Ramsey\Uuid\Uuid;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;

class TagController extends Controller
{
    public function index()
    {
        $tags = Tag::orderByDesc('created_at')
            ->withCount('posts')
            ->get();

        return response()->json([$tags]);
    }

    public function create()
    {
        return response()->json([
            'id' => Uuid::uuid4(),
        ]);
    }

    public function edit(string $id)
    {
        return response()->json([
            'tag' => Tag::findOrFail($id),
        ]);
    }

    public function store()
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
            'slug' => 'required|'.Rule::unique('canvas_tags', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ], $messages)->validate();

        $tag = new Tag(['id' => request('id')]);
        $tag->fill($data);
        $tag->save();

        return response()->json([$tag]);
    }

    public function update(string $id)
    {
        $tag = Tag::findOrFail($id);

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
            'slug' => 'required|'.Rule::unique('canvas_tags', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ], $messages)->validate();

        $tag->fill($data);
        $tag->save();

        return response()->json([$tag]);
    }

    public function destroy(string $id)
    {
        $tag = Tag::findOrFail($id);
        $tag->delete();

        return response()->json([$tag]);
    }
}
