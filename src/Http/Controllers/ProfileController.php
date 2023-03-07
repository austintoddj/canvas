<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Http\Requests\StoreUserRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * Display the specified resource.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function show()
    {
        return response()->json(request()->user('canvas'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  StoreUserRequest  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(StoreUserRequest $request)
    {
        $data = $request->validated();

        $user = $request->user('canvas');

        if (Arr::has($data, 'password')) {
            $user->password = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json([
            'user' => $user->refresh(),
            'i18n' => collect(trans('canvas::app', [], $user->locale))->toJson(),
        ]);
    }
}
