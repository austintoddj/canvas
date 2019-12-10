<?php

namespace Canvas\Http\Controllers;

use Canvas\Tag;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Ramsey\Uuid\Uuid;

class TagController extends Controller
{
    /**
     * Get all the tags.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return response()->json(Tag::forCurrentUser()
            ->withCount('posts')
            ->orderByDesc('created_at')
            ->get());
    }

    /**
     * Get a single tag or return a UUID to create one.
     *
     * @param null $id
     * @return JsonResponse
     * @throws Exception
     */
    public function show($id = null): JsonResponse
    {
        if (Tag::forCurrentUser()->pluck('id')->contains($id) || $this->isNewTag($id)) {
            if ($this->isNewTag($id)) {
                return response()->json(Tag::make([
                    'id' => Uuid::uuid4(),
                ]));
            } else {
                $tag = Tag::find($id);

                if ($tag) {
                    return response()->json($tag);
                } else {
                    return response()->json(null, 301);
                }
            }
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
            'id'      => request('id'),
            'name'    => request('name'),
            'slug'    => request('slug'),
            'user_id' => request()->user()->id,
        ];

        $messages = [
            'required' => __('canvas::validation.required'),
            'unique'   => __('canvas::validation.unique'),
        ];

        validator($data, [
            'name' => 'required',
            'slug' => [
                'required',
                'alpha_dash',
                Rule::unique('canvas_tags')->where(function ($query) use ($data) {
                    return $query->where('slug', $data['slug'])->where('user_id', $data['user_id']);
                })->ignore($id)->whereNull('deleted_at'),
            ],
        ], $messages)->validate();

        if ($id !== 'create') {
            $tag = Tag::find($id);
        } else {
            if ($tag = Tag::onlyTrashed()->where('slug', request('slug'))->first()) {
                $tag->restore();
            } else {
                $tag = new Tag(['id' => request('id')]);
            }
        }

        $tag->fill($data);
        $tag->save();

        return response()->json($tag->refresh());
    }

    /**
     * Delete a tag.
     *
     * @param string $id
     * @return mixed
     */
    public function destroy(string $id)
    {
        $tag = Tag::find($id);

        if ($tag) {
            $tag->delete();

            return response()->json([], 204);
        }
    }

    /**
     * Return true if we're creating a new tag.
     *
     * @param string $id
     * @return bool
     */
    private function isNewTag(string $id): bool
    {
        return $id === 'create';
    }
}
