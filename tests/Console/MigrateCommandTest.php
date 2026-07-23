<?php

use Canvas\Console\MigrateCommand;

it('runs the canvas migrate command', function (): void {
    $this->artisan('canvas:migrate')
        ->assertExitCode(0)
        ->expectsOutputToContain('Canvas migrations complete');
});

it('describes package migrations', function (): void {
    expect((new ReflectionClass(MigrateCommand::class))
        ->getDefaultProperties()['description'] ?? '')
        ->toContain('Canvas package migrations');
});
