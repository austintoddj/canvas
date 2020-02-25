<?php

namespace Canvas\Http\Controllers;

use Canvas\UserMeta;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
            'username' => $metaData->username ?? null,
            'summary' => $metaData->summary ?? null,
            'avatar' => optional($metaData)->avatar && ! empty(optional($metaData)->avatar) ? $metaData->avatar : "https://secure.gravatar.com/avatar/{$emailHash}?s=500",
            'digest' => $metaData->digest ?? false,
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

        $data = [
            'user_id' => request()->user()->id,
            'username' => request('username') ?? $metaData->username,
            'summary' => request('summary') ?? $metaData->summary,
            'avatar' => request('avatar') ?? $metaData->avatar,
            'digest' => request('digest') ?? $metaData->digest,
            'dark_mode' => request('dark_mode') ?? $metaData->dark_mode,
        ];

        $messages = [
            'unique' => __('canvas::app.validation_unique'),
        ];

        validator($data, [
            'user_id' => 'required',
            'username' => [
                'nullable',
                'alpha_dash',
                Rule::unique('canvas_user_meta')->ignore($data['user_id'], 'user_id'),
            ],
        ], $messages)->validate();

        $metaData->fill($data);

        $metaData->save();

        return response()->json($metaData->refresh());
    }
}
