<?php

use Canvas\Enums\Role;

it('maps role labels', function (): void {
    expect(Role::options())->toBe([
        1 => 'Contributor',
        2 => 'Editor',
        3 => 'Admin',
    ]);

    expect(Role::Contributor->label())->toBe('Contributor');
    expect(Role::Editor->label())->toBe('Editor');
    expect(Role::Admin->label())->toBe('Admin');
});

it('exposes integer values for validation and storage', function (): void {
    expect(Role::values())->toBe([1, 2, 3]);
});

it('exposes case names for tooling and commands', function (): void {
    expect(Role::names())->toBe(['Contributor', 'Editor', 'Admin']);
});
