<?php

namespace Canvas\Http\Controllers;

use Canvas\UserMeta;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class SettingsController extends Controller
{
    /**
     * Get the authenticated user settings.
     *
     * @return JsonResponse
     */
    public function show(): JsonResponse
    {
        if (request()->user()) {
            $settings = UserMeta::forCurrentUser()->get();

            $keyed = $settings->mapWithKeys(function ($item, $key) {
                return [$item['name'] => $item['value']];
            });

            return response()->json([
                'user'          => [
                    'username' => $keyed->get('username') ?? null,
                    'summary'  => $keyed->get('summary') ?? null,
                    'avatar'   => $keyed->get('avatar') ?? sprintf('https://secure.gravatar.com/avatar/%s', md5(trim(Str::lower(request()->user()->email)))),
                ],
                'notifications' => [
                    'digest' => $keyed->get('digest') ?? false,
                ],
                'night'    => $keyed->get('night') ? filter_var($keyed->get('night'), FILTER_VALIDATE_BOOLEAN) : false,
            ]);
        } else {
            return response()->json(null, 301);
        }
    }

    public function update(): JsonResponse
    {
        dd(request()->all());

        if (request()->user()) {
            $settings = UserMeta::forCurrentUser()->get();

            $settings->each(function ($item, $key) {
                if (request()->has($item->name)) {
                    $item->update([
                        'value' => request()->get($item->name),
                    ]);
                }
            });

            $keyed = $settings->mapWithKeys(function ($item, $key) {
                return [$item['name'] => $item['value']];
            });

            return response()->json([
                'user'          => [
                    'username' => $keyed->get('username') ?? null,
                    'summary'  => $keyed->get('summary') ?? null,
                    'avatar'   => $keyed->get('avatar') ?? sprintf('https://secure.gravatar.com/avatar/%s', md5(trim(Str::lower(request()->user()->email)))),
                ],
                'notifications' => [
                    'digest' => $keyed->get('digest') ?? false,
                ],
                'night'    => $keyed->get('night') ?? false,
            ]);
        } else {
            return response()->json(null, 301);
        }
    }
}
