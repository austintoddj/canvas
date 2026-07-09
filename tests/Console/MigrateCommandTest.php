<?php

use Canvas\Console\MigrateCommand;

it('runs the canvas migrate command', function (): void {
    $this->artisan('canvas:migrate')
        ->assertExitCode(0)
        ->expectsOutput('Canvas schema migration complete.')
        ->expectsOutputToContain('does not convert v6 data')
        ->expectsOutputToContain('canvas:upgrade-report');
});

it('describes itself as schema-only', function (): void {
    expect((new ReflectionClass(MigrateCommand::class))
        ->getDefaultProperties()['description'] ?? '')
        ->toContain('schema')
        ->toContain('does not reshape v6 data');
});
