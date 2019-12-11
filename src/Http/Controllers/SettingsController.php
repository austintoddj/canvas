<?php

namespace Canvas\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SettingsController extends Controller
{
    /**
     * Get settings for a single user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            return response()->json([
                //
            ]);
        } else {
            return response()->json(null, 301);
        }
    }
}
