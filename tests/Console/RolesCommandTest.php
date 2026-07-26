<?php

use Canvas\Enums\Role;
use Illuminate\Support\Facades\Artisan;

it('lists canvas roles with assign usage', function (): void {
    Artisan::call('canvas:roles');
    $output = Artisan::output();

    expect($output)
        ->toContain(Role::Admin->name)
        ->toContain(Role::Editor->name)
        ->toContain(Role::Contributor->name)
        ->toContain('canvas:assign-role')
        ->toContain('canvas:make-admin');
});
