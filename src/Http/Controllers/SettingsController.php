<?php

namespace Canvas\Http\Controllers;

use Canvas\UserMeta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SettingsController extends Controller
{
    /**
     * Get the authenticated user settings.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $settings = UserMeta::forCurrentUser()->get();

            $keyed = $settings->mapWithKeys(function ($item, $key) {
                return [$item['name'] => $item['value']];
            });

            return response()->json([
                'user'          => [
                    'id'       => $user->id,
                    'email'    => $user->email,
                    'username' => $keyed->get('username') ?? null,
                    'summary'  => $keyed->get('summary') ?? null,
                    'avatar'   => $keyed->get('avatar') ?? null,
                ],
                'notifications' => [
                    'digest' => $keyed->get('digest') ?? null,
                ],
                'appearance'    => $keyed->get('appearance') ?? null,
            ]);
        } else {
            return response()->json(null, 301);
        }
    }

    public function update(Request $request): JsonResponse
    {
        //
    }
}
