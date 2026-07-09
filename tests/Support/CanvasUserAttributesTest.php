<?php

use Canvas\Support\CanvasUserAttributes;

it('lists mass-assignable profile columns without role or preferences', function (): void {
    expect(CanvasUserAttributes::columns())->toBe([
        'username',
        'summary',
        'avatar',
        'website',
        'social',
        'locale',
        'timezone',
        'theme',
        'digest',
    ]);

    expect(CanvasUserAttributes::columns())
        ->not->toContain('role')
        ->not->toContain('preferences');
});

it('lists every canvas_users attribute including access and json fields', function (): void {
    expect(CanvasUserAttributes::all())->toBe([
        ...CanvasUserAttributes::columns(),
        'preferences',
        'role',
    ]);

    expect(CanvasUserAttributes::all())
        ->toContain('role')
        ->toContain('preferences')
        ->toContain('username');
});

it('exposes named attribute groups used by SyncCanvasUser', function (): void {
    expect(CanvasUserAttributes::PROFILE)->toBe([
        'username',
        'summary',
        'avatar',
        'website',
        'social',
    ]);

    expect(CanvasUserAttributes::LOCALIZATION)->toBe(['locale', 'timezone']);
    expect(CanvasUserAttributes::UI)->toBe(['theme']);
    expect(CanvasUserAttributes::NOTIFICATIONS)->toBe(['digest']);
    expect(CanvasUserAttributes::ACCESS)->toBe(['role']);
    expect(CanvasUserAttributes::JSON)->toBe(['preferences']);
});
