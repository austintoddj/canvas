<?php

use Canvas\Enums\Role;
use Canvas\Support\FrontendBootData;
use Canvas\Support\Localization;
use Canvas\Support\Paths;
use Canvas\Support\Version;

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
        'avatar' => $this->admin->avatar,
        'locale' => $this->admin->locale,
        'dark_mode' => $this->admin->dark_mode,
        'digest' => $this->admin->digest,
        'role' => $this->admin->canvas_role->value,
        'default_avatar' => $this->admin->default_avatar,
        'default_locale' => $this->admin->default_locale,
    ]);
});
