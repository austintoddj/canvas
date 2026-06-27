<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Enums\Role;
use Canvas\Http\Requests\UserRequest;
use Canvas\Models\CanvasUser;
use Canvas\Support\Localization;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Ramsey\Uuid\Uuid;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $userModel = config('canvas.user_model');

        return response()->json(
            $userModel::query()
                ->select('id', 'name', 'email')
                ->latest()
                ->withCount('posts')
                ->paginate(), 200
        );
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): JsonResponse
    {
        $userModel = config('canvas.user_model');

        return response()->json($userModel::query()->make([
            'id' => Uuid::uuid4()->toString(),
        ]), 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request, $id): JsonResponse
    {
        $data = $request->validated();
        $currentUser = request()->user(config('canvas.guard'));
        $userModel = config('canvas.user_model');

        $user = $userModel::query()->find($id);

        if (! $user) {
            Gate::forUser($currentUser)->authorize('create', $userModel);

            // Restore a previously soft-deleted account with the same email.
            if ($restored = $userModel::onlyTrashed()->firstWhere('email', $data['email'])) {
                $restored->restore();

                return response()->json([
                    'user' => $restored->refresh(),
                    'i18n' => collect(trans('canvas::app', [], $restored->locale))->toJson(),
                ], 201);
            }

            $user = new $userModel(['id' => $id]);
        } else {
            Gate::forUser($currentUser)->authorize('update', $user);
        }

        if (! Arr::has($data, 'locale') || ! in_array($data['locale'], Localization::availableLanguageCodes(), true)) {
            $data['locale'] = config('app.fallback_locale');
        }

        $canvasData = Arr::only($data, ['dark_mode', 'digest', 'role']);
        $userData = Arr::except($data, ['dark_mode', 'digest', 'role']);

        $user->fill($userData);

        if (Arr::has($userData, 'password')) {
            $user->password = Hash::make($userData['password']);
        }

        $user->save();

        $this->syncCanvasUser($user->id, $canvasData, $currentUser->isAdmin ?? false);

        return response()->json([
            'user' => $user->refresh(),
            'i18n' => collect(trans('canvas::app', [], $user->locale))->toJson(),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($user): JsonResponse
    {
        $user->loadCount('posts');

        return response()->json($user, 200);
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

        $user->delete();

        return response()->json(null, 204);
    }

    private function syncCanvasUser(string $userId, array $canvasData, bool $currentUserIsAdmin): void
    {
        if (empty($canvasData)) {
            return;
        }

        $roleValue = $currentUserIsAdmin && Arr::has($canvasData, 'role') && $canvasData['role'] !== null
            ? Role::from((int) $canvasData['role'])
            : null;

        $preferenceData = Arr::only($canvasData, ['dark_mode', 'digest']);

        $canvasUser = CanvasUser::find($userId);

        if (! $canvasUser) {
            if ($roleValue === null) {
                return;
            }

            CanvasUser::create([
                'user_id' => $userId,
                'role' => $roleValue,
                'dark_mode' => (bool) ($preferenceData['dark_mode'] ?? false),
                'digest' => (bool) ($preferenceData['digest'] ?? false),
            ]);

            return;
        }

        $updates = array_map('boolval', $preferenceData);

        if ($roleValue !== null) {
            $updates['role'] = $roleValue;
        }

        if (! empty($updates)) {
            $canvasUser->update($updates);
        }
    }
}
