<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\Tag;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Ramsey\Uuid\Uuid;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return response()->json(
            Tag::latest()
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
            return response()->json(Tag::make([
                'id' => Uuid::uuid4()->toString(),
            ]), 200);
        } else {
            $tag = Tag::find($id);

            return $tag ? response()->json($tag, 200) : response()->json(null, 404);
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
        $tag = Tag::find($id);

        if (! $tag) {
            if ($tag = Tag::onlyTrashed()->where('slug', request('slug'))->first()) {
                $tag->restore();
            } else {
                $tag = new Tag(['id' => $id]);
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
                Rule::unique('canvas_tags')->where(function ($query) use ($data) {
                    return $query->where('slug', $data['slug'])->where('user_id', $data['user_id']);
                })->ignore($id)->whereNull('deleted_at'),
            ],
        ];

        $messages = [
            'required' => __('canvas::app.validation_required', [], optional($tag->userMeta)->locale),
            'unique' => __('canvas::app.validation_unique', [], optional($tag->userMeta)->locale),
        ];

        validator($data, $rules, $messages)->validate();

        $tag->fill($data);

        $tag->save();

        return response()->json($tag->refresh(), 201);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param $id
     * @return mixed
     */
    public function destroy($id)
    {
        $tag = Tag::findOrFail($id);

        $tag->delete();

        return response()->json(null, 204);
    }
}
