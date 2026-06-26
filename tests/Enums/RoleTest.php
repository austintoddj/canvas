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
