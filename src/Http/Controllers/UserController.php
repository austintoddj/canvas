<?php

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\StoreUserRequest;
use Canvas\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Ramsey\Uuid\Uuid;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            User::latest()
                ->withCount('posts')
                ->paginate(), 200
        );
    }

    /**
     * Show the form for creating a new resource.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function create(Request $request): JsonResponse
    {
        return response()->json(User::make([
            'id' => Uuid::uuid4()->toString(),
            'role' => User::CONTRIBUTOR,
        ]), 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param StoreUserRequest $request
     * @param $id
     * @return JsonResponse
     */
    public function store(StoreUserRequest $request, $id): JsonResponse
    {
        $data = $request->validated();

        $user = User::find($id);

        if (! $user) {
            if ($user = User::onlyTrashed()->firstWhere('email', $data['email'])) {
                $user->restore();

                return response()->json([
                    'user' => $user->refresh(),
                    'i18n' => collect(trans('canvas::app', [], $user->locale))->toJson(),
                ], 201);
            } else {
                $user = new User([
                    'id' => $id,
                ]);
            }
        }

        $user->fill($data);

        if (Arr::has($data, 'password')) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return response()->json([
            'user' => $user->refresh(),
            'i18n' => collect(trans('canvas::app', [], $user->locale))->toJson(),
        ], 201);
    }

    /**
     * Display the specified resource.
     *
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = User::withCount('posts')->find($id);

        return $user ? response()->json($user, 200) : response()->json(null, 404);
    }

    /**
     * Display the specified relationship.
     *
     * @param Request $request
     * @param $id
     * @return JsonResponse
     */
    public function showPosts(Request $request, $id): JsonResponse
    {
        $user = User::with('posts')->find($id);

        return $user ? response()->json($user->posts()->withCount('views')->paginate(), 200) : response()->json(null, 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param Request $request
     * @param $id
     * @return mixed
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user('canvas')->id == $id) {
            return response()->json(null, 403);
        }

        $user = User::findOrFail($id);

        $user->delete();

        return response()->json(null, 204);
    }
}
