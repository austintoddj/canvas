<?php

namespace Canvas\Http\Controllers;

use Canvas\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
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
        ]), 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param Request $request
     * @param $id
     * @return JsonResponse
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request, $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            if ($user = User::onlyTrashed()->firstWhere('email', $request->email)) {
                $user->restore();

                return response()->json($user->refresh(), 201);
            } else {
                $user = new User([
                    'id' => $id,
                    'password' => Hash::make($request->password),
                ]);
            }
        }

        $data = [
            'name' => $request->input('name', $user->name),
            'email' => $request->input('email', $user->email),
            'password' => $request->input('password', $user->password),
            'avatar' => $request->input('avatar', $user->avatar ?? null),
            'dark_mode' => $request->input('darkMode', $user->dark_mode ?? false),
            'digest' => $request->input('digest', $user->digest ?? false),
            'locale' => $request->input('locale', $user->locale ?? null),
            'username' => $request->input('username', $user->username ?? null),
            'summary' => $request->input('summary', $user->summary ?? null),
            'role' => $request->input('role', $user->role ?? null),
        ];

        $rules = [
            'name' => 'required|string',
            'email' => [
                'required',
                'email',
                Rule::unique('canvas_users')->ignore($id),
            ],
            'password' => 'sometimes|nullable|min:8',
            'username' => [
                'nullable',
                'alpha_dash',
                Rule::unique('canvas_users')->ignore($id),
            ],
        ];

        $messages = [
            'required' => trans('canvas::app.validation_required', [], $user->locale),
            'unique' => trans('canvas::app.validation_unique', [], $user->locale),
        ];

        validator($data, $rules, $messages)->validate();

        $user->fill($data);

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
        $user = User::find($id);

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
        if ($request->user()->id == $id) {
            return response()->json(null, 403);
        }

        $user = User::findOrFail($id);

        $user->delete();

        return response()->json(null, 204);
    }
}
