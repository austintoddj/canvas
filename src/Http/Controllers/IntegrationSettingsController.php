<?php

declare(strict_types=1);

namespace Canvas\Http\Controllers;

use Canvas\Enums\AiProvider;
use Canvas\Enums\SettingKey;
use Canvas\Http\Requests\UpdateIntegrationsRequest;
use Canvas\Support\Ai;
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

        return response()->json($this->statusPayload());
    }

    public function update(UpdateIntegrationsRequest $request): JsonResponse
    {
        if ($request->has('unsplash')) {
            /** @var string|null $accessKey */
            $accessKey = $request->input('unsplash.access_key');
            $this->settings->set(SettingKey::UnsplashAccessKey, $accessKey);
        }

        if ($request->has('ai')) {
            $this->updateAiSettings($request);
        }

        return response()->json($this->statusPayload());
    }

    private function updateAiSettings(UpdateIntegrationsRequest $request): void
    {
        if ($request->exists('ai.provider')) {
            /** @var string|null $provider */
            $provider = $request->input('ai.provider');
            $this->settings->set(SettingKey::AiProvider, $provider);
        }

        if ($request->exists('ai.api_key')) {
            /** @var string|null $apiKey */
            $apiKey = $request->input('ai.api_key');
            $this->settings->set(SettingKey::AiApiKey, $apiKey);
        }

        if ($request->exists('ai.model')) {
            /** @var string|null $model */
            $model = $request->input('ai.model');
            $this->settings->set(SettingKey::AiModel, $model);
        }
    }

    /**
     * @return array{
     *     unsplash: array{configured: bool, masked_key: string|null, enabled_at: string|null},
     *     ai: array{configured: bool, provider: string|null, masked_key: string|null, model: string|null, enabled_at: string|null}
     * }
     */
    private function statusPayload(): array
    {
        $accessKey = Unsplash::accessKey();
        $aiKey = Ai::apiKey();
        $provider = Ai::provider();
        $unsplashConfigured = filled($accessKey);
        $aiConfigured = Ai::configured();

        return [
            'unsplash' => [
                'configured' => $unsplashConfigured,
                'masked_key' => SettingsRepository::mask($accessKey),
                'enabled_at' => $unsplashConfigured
                    ? $this->settings->createdAt(SettingKey::UnsplashAccessKey)
                    : null,
            ],
            'ai' => [
                'configured' => $aiConfigured,
                'provider' => $provider instanceof AiProvider ? $provider->value : null,
                'masked_key' => SettingsRepository::mask($aiKey),
                'model' => Ai::modelOverride(),
                'enabled_at' => $aiConfigured
                    ? $this->settings->createdAt(SettingKey::AiApiKey)
                    : null,
            ],
        ];
    }
}
