<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Actions\SyncCanvasUser;
use Canvas\Http\Requests\UserRequest;
use Canvas\Http\Resources\CanvasUserResource;
use Canvas\Http\Resources\UserResource;
use Canvas\Models\CanvasUser;
use Exception;
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
        $userModel = config('canvas.user_model');
        $canvasUserIds = CanvasUser::query()->pluck('user_id');

        return UserResource::collection(
            $userModel::query()
                ->whereIn('id', $canvasUserIds)
                ->select('id', 'name', 'email')
                ->with('canvasUser')
                ->latest()
                ->withCount('posts')
                ->paginate()
        );
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
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request, SyncCanvasUser $syncCanvasUser, $id): JsonResponse
    {
        $currentUser = request()->user(config('canvas.guard'));
        $userModel = config('canvas.user_model');

        $user = $userModel::query()->find($id);

        if (! $user) {
            abort(404);
        }

        Gate::forUser($currentUser)->authorize('update', $user);

        $created = $syncCanvasUser($user->id, $request->validated(), $currentUser->isAdmin ?? false);

        return response()->json([
            'user' => UserResource::make($user->load('canvasUser')->refresh()),
        ], $created ? 201 : 200);
    }

    /**
     * Display the specified resource.
     */
    public function show($user): UserResource
    {
        $user->load('canvasUser')->loadCount('posts');

        return UserResource::make($user);
    }

    /**
     * Display the specified relationship.
     */
    public function posts($user): JsonResponse
    {
        return response()->json($user->posts()->withCount('views')->paginate(), 200);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @return mixed
     *
     * @throws Exception
     */
    public function destroy($user)
    {
        Gate::forUser(request()->user(config('canvas.guard')))->authorize('delete', $user);

        CanvasUser::query()->where('user_id', $user->getKey())->delete();

        return response()->json(null, 204);
    }
}
