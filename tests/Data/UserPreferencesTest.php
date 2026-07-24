<?php

use Canvas\Data\UserPreferences;

it('returns empty defaults until concrete keys are introduced', function (): void {
    expect(UserPreferences::defaults())->toBe([]);
});

it('resolves stored preferences against defaults', function (): void {
    expect(UserPreferences::resolve(null))->toBe([]);

    expect(UserPreferences::resolve([
        'example' => [
            'enabled' => true,
        ],
    ]))->toBe([
        'example' => [
            'enabled' => true,
        ],
    ]);
});

it('merges incoming preferences without dropping existing values', function (): void {
    $merged = UserPreferences::merge(
        [
            'alpha' => [
                'enabled' => true,
            ],
            'beta' => 'keep-me',
        ],
        [
            'alpha' => [
                'count' => 2,
            ],
        ],
    );

    expect($merged)->toBe([
        'alpha' => [
            'enabled' => true,
            'count' => 2,
        ],
        'beta' => 'keep-me',
    ]);
});

it('merges partial nested updates without replacing sibling keys', function (): void {
    $merged = UserPreferences::merge(
        [
            'example' => [
                'enabled' => false,
                'label' => 'kept',
            ],
        ],
        [
            'example' => [
                'enabled' => true,
            ],
        ],
    );

    expect($merged)->toBe([
        'example' => [
            'enabled' => true,
            'label' => 'kept',
        ],
    ]);
});
