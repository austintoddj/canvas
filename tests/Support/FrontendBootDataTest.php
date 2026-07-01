<?php

use Canvas\Enums\Role;
use Canvas\Http\Resources\UserResource;
use Canvas\Models\CanvasUser;
use Canvas\Support\FrontendBootData;
use Canvas\Support\Localization;
use Canvas\Support\Paths;
use Canvas\Support\Version;
use Illuminate\Foundation\Auth\User as Authenticatable;

it('builds the frontend boot payload', function (): void {
    config()->set('canvas.unsplash.access_key', 'test-access-key');

    $bootData = FrontendBootData::forUser($this->admin);

    expect($bootData)->toMatchArray([
        'languageCodes' => Localization::availableLanguageCodes(),
        'maxUpload' => config('canvas.upload_filesize'),
        'path' => Paths::basePath(),
        'roles' => Role::options(),
        'timezone' => config('app.timezone'),
        'translations' => Localization::availableTranslations($this->admin->locale),
        'unsplash' => 'test-access-key',
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
    $user = new class extends Authenticatable
    {
        protected $keyType = 'string';

        public $incrementing = false;
    };

    $user->id = $this->admin->id;
    $user->name = $this->admin->name;
    $user->email = $this->admin->email;

    $bootData = FrontendBootData::forUser($user);

    expect($bootData['user']['canvas']['role'])->toBe(Role::Admin->value);
    expect($bootData['user']['avatar_url'])->toBeString();
});

it('includes nested canvas data when the relationship is set without a canvasUser method', function (): void {
    $user = new class extends Authenticatable
    {
        protected $keyType = 'string';

        public $incrementing = false;
    };

    $user->id = $this->admin->id;
    $user->name = $this->admin->name;
    $user->email = $this->admin->email;
    $user->setRelation('canvasUser', CanvasUser::query()->find($this->admin->id));

    expect(UserResource::make($user)->resolve())->toHaveKey('canvas');
});
