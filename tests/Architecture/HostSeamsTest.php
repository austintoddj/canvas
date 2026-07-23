<?php

// Invariant: core package paths must not require host HasCanvasAccess relations

it('does not eager-load host canvasUser relations from core package sources', function (): void {
    $files = collect(glob(dirname(__DIR__, 2).'/src/**/*.php') ?: [])
        ->merge(glob(dirname(__DIR__, 2).'/src/*/*.php') ?: [])
        ->merge(glob(dirname(__DIR__, 2).'/src/*/*/*.php') ?: [])
        ->merge(glob(dirname(__DIR__, 2).'/src/*/*/*/*.php') ?: [])
        ->unique()
        ->filter(fn (string $path): bool => ! str_contains($path, '/Concerns/HasCanvasAccess.php'));

    $violations = [];

    foreach ($files as $path) {
        $contents = file_get_contents($path) ?: '';

        if (str_contains($contents, "with('canvasUser')")
            || str_contains($contents, 'with("canvasUser")')
            || str_contains($contents, "with('user.canvasUser'")
            || str_contains($contents, 'with("user.canvasUser"')) {
            $violations[] = $path;
        }
    }

    expect($violations)->toBeEmpty(
        'Core package code must not with(canvasUser) on host models. Offenders: '.implode(', ', $violations)
    );
});
