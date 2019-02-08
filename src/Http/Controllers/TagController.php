<?php

namespace Canvas\Http\Controllers;

use Canvas\Tag;
use Illuminate\View\View;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;
use Illuminate\Http\RedirectResponse;

class TagController extends Controller
{
    /**
     * Show a paginated list of tags.
     *
     * @return View
     */
    public function index(): View
    {
        $data = [
            'tags' => Tag::orderByDesc('created_at')->withCount('posts')->paginate(15),
        ];

        return view('canvas::tags.index', compact('data'));
    }

    /**
     * Show the form for creating a new tag.
     *
     * @return View
     */
    public function create(): View
    {
        $data = [
            'id' => Str::uuid(),
        ];

        return view('canvas::tags.create', compact('data'));
    }

    /**
     * Show the form for editing a tag.
     *
     * @param string $id
     * @return View
     */
    public function edit(string $id): View
    {
        $data = [
            'tag' => Tag::findOrFail($id),
        ];

        return view('canvas::tags.edit', compact('data'));
    }

    /**
     * Store a newly created tag in storage.
     *
     * @return RedirectResponse
     */
    public function store(): RedirectResponse
    {
        $data = [
            'id'   => request('id'),
            'name' => request('name'),
            'slug' => request('slug'),
        ];

        validator($data, [
            'name' => 'required',
            'slug' => 'required|'.Rule::unique('canvas_tags', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ])->validate();

        $tag = new Tag(['id' => request('id')]);
        $tag->fill($data);
        $tag->save();

        return redirect(route('canvas.tag.edit', $tag->id))->with('notify', 'Saved!');
    }

    /**
     * Update a tag in storage.
     *
     * @param string $id
     * @return RedirectResponse
     */
    public function update(string $id): RedirectResponse
    {
        $tag = Tag::findOrFail($id);

        $data = [
            'id'   => request('id'),
            'name' => request('name'),
            'slug' => request('slug'),
        ];

        validator($data, [
            'name' => 'required',
            'slug' => 'required|'.Rule::unique('canvas_tags', 'slug')->ignore(request('id')).'|regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/i',
        ])->validate();

        $tag->fill($data);
        $tag->save();

        return redirect(route('canvas.tag.edit', $tag->id))->with('notify', 'Saved!');
    }

    /**
     * Soft delete a tag in storage.
     *
     * @param string $id
     * @return RedirectResponse
     */
    public function destroy(string $id): RedirectResponse
    {
        $tag = Tag::findOrFail($id);
        $tag->delete();

        return redirect(route('canvas.tag.index'));
    }
}
