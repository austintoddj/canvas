<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Enums\SettingKey;
use Canvas\Http\Requests\UpdateIntegrationsRequest;
use Canvas\Support\SettingsRepository;
use Canvas\Support\Unsplash;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

class IntegrationSettingsController extends Controller
{
    public function __construct(
        private readonly SettingsRepository $settings,
    ) {}

    public function show(): JsonResponse
    {
        Gate::forUser(request()->user(config('canvas.guard')))->authorize('manage-settings');

        $accessKey = Unsplash::accessKey();

        return response()->json([
            'unsplash' => [
                'configured' => filled($accessKey),
                'masked_key' => SettingsRepository::mask($accessKey),
            ],
        ]);
    }

    public function update(UpdateIntegrationsRequest $request): JsonResponse
    {
        /** @var string|null $accessKey */
        $accessKey = $request->input('unsplash.access_key');

        $this->settings->set(SettingKey::UnsplashAccessKey, $accessKey);

        $resolved = Unsplash::accessKey();

        return response()->json([
            'unsplash' => [
                'configured' => filled($resolved),
                'masked_key' => SettingsRepository::mask($resolved),
            ],
        ]);
    }
}
