<?php

use Canvas\Enums\AiProvider;
use Canvas\Enums\Role;
use Canvas\Http\Resources\UserResource;
use Canvas\Models\CanvasUser;
use Canvas\Support\FrontendBootData;
use Canvas\Support\Localization;
use Canvas\Support\Paths;
use Canvas\Support\Version;

it('builds the frontend boot payload', function (): void {
    setUnsplashAccessKey('test-access-key');

    $bootData = FrontendBootData::forUser($this->admin);

    expect($bootData)->toMatchArray([
        'languages' => Localization::languageOptions(),
        'maxUpload' => config('canvas.upload_filesize'),
        'path' => Paths::basePath(),
        'roles' => Role::options(),
        'appTimezone' => config('app.timezone'),
        'defaultLocale' => Localization::resolveLocale(null),
        'translations' => Localization::availableTranslations($this->admin->locale),
        'unsplash' => true,
        'ai' => false,
        'version' => Version::installed(),
    ]);

    expect($bootData['user'])->toMatchArray([
        'id' => $this->admin->getAuthIdentifier(),
        'name' => $this->admin->name,
        'email' => $this->admin->email,
    ]);

    expect($bootData['user']['avatar_url'])->toBeString();
    expect($bootData['user']['canvas'])->toMatchArray([
        'role' => $this->admin->canvas_role->value,
        'username' => $this->admin->username,
        'locale' => $this->admin->locale,
        'theme' => $this->admin->theme,
        'digest' => $this->admin->digest,
    ]);
});

it('builds boot payload for host users without a canvasUser relationship', function (): void {
    useBareUserModel();

    $bootData = FrontendBootData::forUser(bareUser($this->admin->id));

    expect($bootData['user']['id'])->toBe($this->admin->id);
    expect($bootData['user']['canvas']['role'])->toBe(Role::Admin->value);
    expect($bootData['user']['avatar_url'])->toBeString();
});

it('reports unsplash as false when no access key is stored', function (): void {
    $bootData = FrontendBootData::forUser($this->admin);

    expect($bootData['unsplash'])->toBeFalse();
});

it('reports ai as true when provider and key are stored', function (): void {
    setAiIntegration(AiProvider::Xai, 'test-ai-key');

    $bootData = FrontendBootData::forUser($this->admin);

    expect($bootData['ai'])->toBeTrue();
});

it('includes nested canvas data when the relationship is set without a canvasUser method', function (): void {
    useBareUserModel();

    $user = bareUser($this->admin->id);
    $user->setRelation('canvasUser', CanvasUser::query()->find($this->admin->id));

    expect(UserResource::make($user)->resolve())->toHaveKey('canvas');
});
