<?php

use Canvas\Enums\Role;
use Canvas\Http\Requests\UserRequest;

it('accepts an empty profile update', function (): void {
    assertFormRequestValid(
        UserRequest::class,
        [],
        $this->contributor,
        ['id' => $this->contributor->id],
        "canvas/api/users/{$this->contributor->id}",
    );
});

it('normalizes empty strings to null before validation', function (): void {
    assertFormRequestValid(
        UserRequest::class,
        [
            'website' => '',
            'summary' => '',
            'timezone' => '',
        ],
        $this->contributor,
        ['id' => $this->contributor->id],
        "canvas/api/users/{$this->contributor->id}",
    );
});

it('rejects duplicate usernames', function (): void {
    assertFormRequestInvalid(
        UserRequest::class,
        [
            'username' => $this->editor->username,
        ],
        $this->contributor,
        ['username'],
        ['id' => $this->contributor->id],
        "canvas/api/users/{$this->contributor->id}",
    );
});

it('rejects invalid usernames', function (): void {
    assertFormRequestInvalid(
        UserRequest::class,
        [
            'username' => 'invalid username',
        ],
        $this->contributor,
        ['username'],
        ['id' => $this->contributor->id],
        "canvas/api/users/{$this->contributor->id}",
    );
});

it('rejects summaries that exceed the maximum length', function (): void {
    assertFormRequestInvalid(
        UserRequest::class,
        [
            'summary' => str_repeat('a', 5001),
        ],
        $this->contributor,
        ['summary'],
        ['id' => $this->contributor->id],
        "canvas/api/users/{$this->contributor->id}",
    );
});

it('rejects invalid websites timezones locales roles and social payloads', function (): void {
    assertFormRequestInvalid(
        UserRequest::class,
        [
            'website' => 'not-a-url',
            'timezone' => 'Not/A_Timezone',
            'locale' => 'zz',
            'role' => 99,
            'social' => 'twitter',
        ],
        $this->contributor,
        ['website', 'timezone', 'locale', 'role', 'social'],
        ['id' => $this->contributor->id],
        "canvas/api/users/{$this->contributor->id}",
    );
});

it('rejects non-boolean preference flags', function (): void {
    assertFormRequestInvalid(
        UserRequest::class,
        [
            'dark_mode' => 'yes',
            'digest' => 'yes',
            'preferences' => [
                'onboarding' => [
                    'complete' => 'yes',
                ],
            ],
        ],
        $this->contributor,
        ['dark_mode', 'digest', 'preferences.onboarding.complete'],
        ['id' => $this->contributor->id],
        "canvas/api/users/{$this->contributor->id}",
    );
});

it('accepts a valid canvas profile payload', function (): void {
    assertFormRequestValid(
        UserRequest::class,
        [
            'username' => 'canvas-writer',
            'summary' => 'Writer bio',
            'website' => 'https://example.com',
            'social' => [
                'twitter' => 'writer',
            ],
            'locale' => 'en',
            'timezone' => 'America/Chicago',
            'dark_mode' => true,
            'digest' => false,
            'preferences' => [
                'onboarding' => [
                    'complete' => true,
                ],
            ],
            'role' => Role::Contributor->value,
        ],
        $this->admin,
        ['id' => $this->contributor->id],
        "canvas/api/users/{$this->contributor->id}",
    );
});
