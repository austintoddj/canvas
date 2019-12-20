<?php

namespace Canvas\Http\Controllers;

use Canvas\UserMeta;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class SettingsController extends Controller
{
    /**
     * Get user settings.
     *
     * @return JsonResponse
     */
    public function show(): JsonResponse
    {
        $metaData = UserMeta::forCurrentUser()->first();
        $emailHash = md5(trim(Str::lower(request()->user()->email)));

        return response()->json([
            'username'  => $metaData->username ?? null,
            'summary'   => $metaData->summary ?? null,
            'avatar'    => $metaData->avatar && ! empty($metaData->avatar) ? $metaData->avatar : "https://secure.gravatar.com/avatar/{$emailHash}?s=500",
            'digest'    => $metaData->digest ?? false,
            'dark_mode' => $metaData->dark_mode ?? 0,
        ]);
    }

    /**
     * Save user settings.
     *
     * @return JsonResponse
     */
    public function update(): JsonResponse
    {
        $metaData = UserMeta::forCurrentUser()->first() ?? new UserMeta();

        $metaData->fill([
            'user_id'   => request()->user()->id,
            'username'  => request('username') ?? $metaData->username,
            'summary'   => request('summary') ?? $metaData->summary,
            'avatar'    => request('avatar') ?? $metaData->avatar,
            'digest'    => request('digest') ?? $metaData->digest,
            'dark_mode' => request('dark_mode') ?? $metaData->dark_mode,
        ]);

        $metaData->save();

        return response()->json($metaData->refresh());
    }
}
