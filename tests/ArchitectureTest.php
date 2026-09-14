<?php

use Canvas\Http\Requests\FormRequest;

arch('package source uses strict types')
    ->expect('Canvas')
    ->toUseStrictTypes();

arch('controllers are suffixed with Controller')
    ->expect('Canvas\Http\Controllers')
    ->toHaveSuffix('Controller');

arch('policies are suffixed with Policy')
    ->expect('Canvas\Policies')
    ->toHaveSuffix('Policy');

arch('enums are enums')
    ->expect('Canvas\Enums')
    ->toBeEnums();

arch('console commands are suffixed with Command')
    ->expect('Canvas\Console')
    ->classes()
    ->toHaveSuffix('Command');

arch('form requests extend the package FormRequest base')
    ->expect('Canvas\Http\Requests')
    ->toExtend(FormRequest::class)
    ->ignoring(FormRequest::class);

arch('actions are invokable')
    ->expect('Canvas\Actions')
    ->toBeInvokable();

arch('debug helpers are not used in package code')
    ->expect(['dd', 'dump', 'die', 'var_dump'])
    ->not->toBeUsed();

// Host-facing manual lives under docs/ — keep the page set so the wiki-replacement tree does not vanish by accident.
it('keeps the host documentation page set', function (): void {
    $root = dirname(__DIR__);

    foreach ([
        'docs/README.md',
        'docs/installation.md',
        'docs/configuration.md',
        'docs/authorization.md',
        'docs/canvas-ui.md',
        'docs/content.md',
        'docs/webhooks.md',
        'docs/assets/readme.png',
    ] as $relative) {
        expect(is_file($root.'/'.$relative))->toBeTrue($relative.' is missing');
    }
});
