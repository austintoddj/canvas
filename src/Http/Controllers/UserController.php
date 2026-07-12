<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Actions\SyncCanvasUser;
use Canvas\Http\Requests\UserLookupRequest;
use Canvas\Http\Requests\UserRequest;
use Canvas\Http\Resources\CanvasUserResource;
use Canvas\Http\Resources\UserResource;
use Canvas\Models\CanvasUser;
use Canvas\Models\Post;
use Canvas\Support\AuthorAvatar;
use Canvas\Support\HostUser;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $userModel = HostUser::modelClass();
        $hostTable = (new $userModel)->getTable();

        $canvasUsers = CanvasUser::query()
            ->with(['user' => fn ($query) => $query->select('id', 'name', 'email')])
            ->join($hostTable, 'canvas_users.user_id', '=', "{$hostTable}.id")
            ->orderByDesc("{$hostTable}.created_at")
            ->select('canvas_users.*')
            ->withPostsCount()
            ->paginate();

        $canvasUsers->through(
            fn (CanvasUser $canvasUser): mixed => UserResource::hostUserFromCanvasUser($canvasUser),
        );

        return UserResource::collection($canvasUsers);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): JsonResponse
    {
        return response()->json([
            'canvas' => CanvasUserResource::defaults(),
        ], 200);
    }

    /**
     * Look up a host user by email or id for granting Canvas access.
     */
    public function lookup(UserLookupRequest $request): JsonResponse
    {
        $identifier = $request->identifier();

        if ($identifier === '') {
            abort(404);
        }

        $user = HostUser::findByIdentifier($identifier);

        if ($user === null) {
            abort(404);
        }

        $email = (string) data_get($user, 'email', '');
        $canvasUser = CanvasUser::query()->find($user->getKey());

        return response()->json([
            'id' => $user->getKey(),
            'name' => data_get($user, 'name'),
            'email' => $email,
            'avatar_url' => AuthorAvatar::url($canvasUser?->avatar, $email),
            'has_canvas_access' => $canvasUser !== null,
            'role' => $canvasUser?->role?->value,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request, SyncCanvasUser $syncCanvasUser, int|string $id): JsonResponse
    {
        $currentUser = request()->user(config('canvas.guard'));

        $user = HostUser::modelClass()::query()->find($id);

        if (! $user) {
            abort(404);
        }

        Gate::forUser($currentUser)->authorize('update', $user);

        $created = $syncCanvasUser((string) $user->getKey(), $request->validated(), CanvasUser::isAdmin($currentUser));

        $canvasUser = CanvasUser::query()->findOrFail($user->getKey());
        $user->setRelation('canvasUser', $canvasUser);

        return response()->json([
            'user' => UserResource::make($user),
        ], $created ? 201 : 200);
    }

    /**
     * Display the specified resource.
     */
    public function show(Model $user): UserResource
    {
        $canvasUser = CanvasUser::query()
            ->with(['user' => fn ($query) => $query->select('id', 'name', 'email')])
            ->withPostsCount()
            ->findOrFail($user->getKey());

        return UserResource::make(UserResource::hostUserFromCanvasUser($canvasUser));
    }

    /**
     * Display the specified relationship.
     */
    public function posts(Model $user): JsonResponse
    {
        return response()->json(
            Post::query()
                ->where('user_id', $user->getKey())
                ->withCount('views')
                ->paginate(),
            200,
        );
    }

    /**
     * Remove the specified resource from storage.
     *
     * @throws Exception
     */
    public function destroy(Model $user): JsonResponse
    {
        Gate::forUser(request()->user(config('canvas.guard')))->authorize('delete', $user);

        CanvasUser::query()->where('user_id', $user->getKey())->delete();

        return response()->json(null, 204);
    }
}
