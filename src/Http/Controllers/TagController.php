<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Tag;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;
use Illuminate\View\View;

class TagController extends Controller
{
    /**
     * Get all of the tags.
     *
     * @return View
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
     * @return View
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
     *
     * @return View
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
     * @return RedirectResponse
     */
    public function store()
    {
        $data = [
            'id' => request('id'),
            'name' => request('name'),
            'slug' => request('slug'),
        ];

        validator($data, [
            'name' => 'required',
            'slug' => 'required|' . Rule::unique('canvas_tags', 'slug')->ignore(request('id'))
                . '|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ])->validate();

        $tag = new Tag(['id' => request('id')]);
        $tag->fill($data);
        $tag->save();

        return redirect(route('canvas.tag.edit', $tag->id))->with('notify', 'Saved!');
    }

    /**
     * Save a given tag.
     *
     * @param string $id
     *
     * @return RedirectResponse
     */
    public function update(string $id)
    {
        $tag = Tag::findOrFail($id);

        $data = [
            'id' => request('id'),
            'name' => request('name'),
            'slug' => request('slug'),
        ];

        validator($data, [
            'name' => 'required',
            'slug' => 'required|' . Rule::unique('canvas_tags', 'slug')->ignore(request('id'))
                . '|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ])->validate();

        $tag->fill($data);
        $tag->save();

        return redirect(route('canvas.tag.edit', $tag->id))->with('notify', 'Saved!');
    }

    /**
     * Delete a given tag.
     *
     * @param string $id
     *
     * @return RedirectResponse
     * @throws Exception
     */
    public function destroy(string $id)
    {
        $tag = Tag::findOrFail($id);
        $tag->delete();

        return redirect(route('canvas.tag.index'));
    }
}
