<?php

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Canvas\Http\Requests\UserRequest;
use Canvas\Models\User;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;
use Ramsey\Uuid\Uuid;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        return response()->json(
            User::query()
                ->select('id', 'name', 'email', 'avatar', 'role')
                ->latest()
                ->withCount('posts')
                ->paginate(), 200
        );
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return JsonResponse
     */
    public function create(): JsonResponse
    {
        return response()->json(User::query()->make([
            'id' => Uuid::uuid4()->toString(),
            'role' => User::CONTRIBUTOR,
        ]), 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  UserRequest  $request
     * @param  $id
     * @return JsonResponse
     */
    public function store(UserRequest $request, $id): JsonResponse
    {
        $data = $request->validated();

        $user = User::query()->find($id);

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

        if (! Arr::has($data, 'locale') || ! in_array($data['locale'], Canvas::availableLanguageCodes())) {
            $data['locale'] = config('app.fallback_locale');
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
     * @param  $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        $user = User::query()->withCount('posts')->find($id);

        return $user ? response()->json($user, 200) : response()->json(null, 404);
    }

    /**
     * Display the specified relationship.
     *
     * @param  $id
     * @return JsonResponse
     */
    public function posts($id): JsonResponse
    {
        $user = User::query()->with('posts')->find($id);

        return $user ? response()->json($user->posts()->withCount('views')->paginate(), 200) : response()->json(null, 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  $id
     * @return mixed
     *
     * @throws Exception
     */
    public function destroy($id)
    {
        // Prevent a user from deleting their own account
        if (request()->user('canvas')->id == $id) {
            return response()->json(null, 403);
        }

        $user = User::query()->findOrFail($id);

        $user->delete();

        return response()->json(null, 204);
    }
}
