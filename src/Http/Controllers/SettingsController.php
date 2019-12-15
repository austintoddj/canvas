<?php

namespace Canvas\Http\Controllers;

use Canvas\UserMeta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

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
        if (request()->user()) {
            $settings = UserMeta::forCurrentUser()->get();

            $keyed = $settings->mapWithKeys(function ($item, $key) {
                return [$item['name'] => $item['value']];
            });

            return response()->json([
                'user'          => [
                    'id'       => request()->user()->id,
                    'username' => $keyed->get('username') ?? null,
                    'summary'  => $keyed->get('summary') ?? null,
                    'avatar'   => $keyed->get('avatar') ?? sprintf('https://secure.gravatar.com/avatar/%s', md5(trim(Str::lower(request()->user()->email)))),
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

    public function update(): JsonResponse
    {
        if (request()->user()) {
            $settings = UserMeta::forCurrentUser()->get();

            dd($settings->all());

            $settings->each(function ($item, $key) {
                //
            });
        } else {
            return response()->json(null, 301);
        }
    }
}
