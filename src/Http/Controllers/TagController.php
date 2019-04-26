<?php

namespace Canvas\Http\Controllers;

use Canvas\Tag;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;

class TagController extends Controller
{
    /**
     * Get all of the tags.
     *
     * @return \Illuminate\View\View
     */
    public function index()
    {
        $data = [
            'tags' => Tag::orderByDesc('created_at')->withCount('posts')->get(),
        ];

        return view('canvas::tags.index', compact('data'));
    }

    /**
     * Create a new tag.
     *
     * @return \Illuminate\View\View
     */
    public function create()
    {
        $data = [
            'id' => Str::uuid(),
        ];

        return view('canvas::tags.create', compact('data'));
    }

    /**
     * Edit a given tag.
     *
     * @param string $id
     * @return \Illuminate\View\View
     */
    public function edit(string $id)
    {
        $data = [
            'tag' => Tag::findOrFail($id),
        ];

        return view('canvas::tags.edit', compact('data'));
    }

    /**
     * Save a new tag.
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store()
    {
        $data = [
            'id'   => request('id'),
            'name' => request('name'),
            'slug' => request('slug'),
        ];

        $messages = [
            'unique' => __('canvas::validation.unique'),
        ];

        validator($data, [
            'name' => 'required',
            'slug' => 'required|'.Rule::unique('canvas_tags', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ], $messages)->validate();

        $tag = new Tag(['id' => request('id')]);
        $tag->fill($data);
        $tag->save();

        return redirect(route('canvas.tag.edit', $tag->id))->with('notify', __('canvas::nav.notify.success'));
    }

    /**
     * Save a given tag.
     *
     * @param string $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(string $id)
    {
        $tag = Tag::findOrFail($id);

        $data = [
            'id'   => request('id'),
            'name' => request('name'),
            'slug' => request('slug'),
        ];

        $messages = [
            'unique' => __('canvas::validation.unique'),
        ];

        validator($data, [
            'name' => 'required',
            'slug' => 'required|'.Rule::unique('canvas_tags', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ], $messages)->validate();

        $tag->fill($data);
        $tag->save();

        return redirect(route('canvas.tag.edit', $tag->id))->with('notify', __('canvas::nav.notify.success'));
    }

    /**
     * Delete a given tag.
     *
     * @param string $id
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(string $id)
    {
        $tag = Tag::findOrFail($id);
        $tag->delete();

        return redirect(route('canvas.tag.index'));
    }
}
