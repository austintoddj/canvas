<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Canvas;
use Canvas\Http\Requests\StoreUserRequest;
use Canvas\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Routing\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $sortAscending = request()->query('sort', 'desc') === 'asc';
        $filterByRole = request()->query('role');

        return response()->json(
            User::query()
                ->select('id', 'name', 'email', 'avatar', 'role')
                ->when($filterByRole, function (Builder $query) {
                    return $query->where('role', request()->query('role'));
                }, function (Builder $query) {
                    return $query;
                })
                ->when($sortAscending, function (Builder $query) {
                    return $query->oldest();
                }, function (Builder $query) {
                    return $query->latest();
                })
                ->withCount('posts')
                ->paginate()
        );
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  StoreUserRequest  $request
     * @return void
     */
    public function store(StoreUserRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $id)
    {
        $user = User::query()->withCount('posts')->findOrFail($id);

        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Canvas\Http\Requests\StoreUserRequest  $request
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(StoreUserRequest $request, string $id)
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
     * Display the specified relationship.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function posts(string $id)
    {
        $user = User::query()->with('posts')->findOrFail($id);

        return response()->json($user->posts()->withCount('views')->paginate());
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(string $id)
    {
        // Prevent a user from deleting their own account
        if (request()->user('canvas')->id === $id) {
            return response()->json(null, 403);
        }

        $user = User::query()->findOrFail($id);

        $user->delete();

        return response()->json(null, 204);
    }
}
