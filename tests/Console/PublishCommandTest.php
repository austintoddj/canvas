<?php

beforeEach(function (): void {
    $configPath = config_path('canvas.php');
    $manifestPath = public_path('vendor/canvas/manifest.json');

    $this->publishedConfigBackup = is_file($configPath)
        ? file_get_contents($configPath)
        : null;

    $this->publishedManifestBackup = is_file($manifestPath)
        ? file_get_contents($manifestPath)
        : null;
});

afterEach(function (): void {
    $configPath = config_path('canvas.php');

    if ($this->publishedConfigBackup !== null) {
        file_put_contents($configPath, $this->publishedConfigBackup);
    } elseif (is_file($configPath)) {
        unlink($configPath);
    }

    $manifestPath = public_path('vendor/canvas/manifest.json');

    if ($this->publishedManifestBackup !== null) {
        if (! is_dir(dirname($manifestPath))) {
            mkdir(dirname($manifestPath), 0777, true);
        }

        file_put_contents($manifestPath, $this->publishedManifestBackup);
    }
});

it('exits successfully and outputs the publishing message', function (): void {
    $this->artisan('canvas:publish')
        ->assertExitCode(0)
        ->expectsOutput('Publishing complete.');
});

it('publishes the config file', function (): void {
    $this->artisan('canvas:publish');

    $this->assertFileExists(config_path('canvas.php'));
    expect(file_get_contents(config_path('canvas.php')))->toContain("'path' => env('CANVAS_PATH', 'canvas')");
});

it('publishes the vendor assets', function (): void {
    $this->artisan('canvas:publish');

    $manifestPath = public_path('vendor/canvas/manifest.json');

    $this->assertFileExists($manifestPath);

    $manifest = json_decode(file_get_contents($manifestPath), true);

    expect($manifest)->toBeArray()
        ->and($manifest)->toHaveKey('resources/js/app.tsx');

    $this->assertFileExists(public_path('vendor/canvas/'.$manifest['resources/js/app.tsx']['file']));
});

// Invariant: published config must not be overwritten without --force
it('does not overwrite an existing config without --force', function (): void {
    $this->artisan('canvas:publish');

    file_put_contents(config_path('canvas.php'), '<?php return ["sentinel" => true];');

    $this->artisan('canvas:publish')
        ->assertExitCode(0);

    expect(file_get_contents(config_path('canvas.php')))->toContain('sentinel');
});

it('overwrites the config when --force is passed', function (): void {
    $this->artisan('canvas:publish');

    file_put_contents(config_path('canvas.php'), '<?php return ["sentinel" => true];');

    $this->artisan('canvas:publish', ['--force' => true])
        ->assertExitCode(0);

    expect(file_get_contents(config_path('canvas.php')))
        ->not->toContain('sentinel')
        ->toContain("'path' => env('CANVAS_PATH', 'canvas')");
});

it('always republishes vendor assets', function (): void {
    $this->artisan('canvas:publish');

    $manifestPath = public_path('vendor/canvas/manifest.json');
    file_put_contents($manifestPath, '{"sentinel":true}');

    $this->artisan('canvas:publish')
        ->assertExitCode(0);

    $manifest = json_decode(file_get_contents($manifestPath), true);

    expect($manifest)->toBeArray()
        ->not->toHaveKey('sentinel')
        ->toHaveKey('resources/js/app.tsx');
});
