<?php

use Canvas\Tests\TestCase;

beforeEach(function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $configPath = config_path('canvas.php');
        $manifestPath = public_path('vendor/canvas/manifest.json');

        $this->publishedConfigBackup = is_file($configPath)
            ? file_get_contents($configPath)
            : null;

        $this->publishedManifestBackup = is_file($manifestPath)
            ? file_get_contents($manifestPath)
            : null;
    });
});

afterEach(function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $configPath = config_path('canvas.php');

        if ($this->publishedConfigBackup !== null) {
            $staging = $configPath.'.staging.'.getmypid();
            file_put_contents($staging, $this->publishedConfigBackup);
            rename($staging, $configPath);
        } elseif (is_file($configPath)) {
            unlink($configPath);
        }

        $manifestPath = public_path('vendor/canvas/manifest.json');

        if ($this->publishedManifestBackup !== null) {
            if (! is_dir(dirname($manifestPath))) {
                mkdir(dirname($manifestPath), 0777, true);
            }

            $staging = $manifestPath.'.staging.'.getmypid();
            file_put_contents($staging, $this->publishedManifestBackup);
            rename($staging, $manifestPath);
        }
    });
});

it('exits successfully and outputs the publishing message', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $this->artisan('canvas:publish')
            ->assertExitCode(0)
            ->expectsOutput('Publishing complete.');
    });
});

it('publishes the config file', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $this->artisan('canvas:publish');

        $this->assertFileExists(config_path('canvas.php'));
        expect(file_get_contents(config_path('canvas.php')))->toContain("'path' => env('CANVAS_PATH', 'canvas')");
    });
});

it('publishes the vendor assets', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $this->artisan('canvas:publish');

        $manifestPath = public_path('vendor/canvas/manifest.json');

        $this->assertFileExists($manifestPath);

        $manifest = json_decode(file_get_contents($manifestPath), true);

        expect($manifest)->toBeArray()
            ->and($manifest)->toHaveKey('resources/js/app.tsx');

        $this->assertFileExists(public_path('vendor/canvas/'.$manifest['resources/js/app.tsx']['file']));
    });
});

// Invariant: published config must not be overwritten without --force
it('does not overwrite an existing config without --force', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $this->artisan('canvas:publish');

        // Keep a full valid config so parallel workers never boot on a stub file
        // (a bare `return ["sentinel" => true]` — or empty mid-write — breaks mergeConfigFrom).
        $marked = file_get_contents(config_path('canvas.php'));
        $marked = preg_replace('/<\?php/', "<?php\n// canvas-config-sentinel", $marked, 1);
        $staging = config_path('canvas.php').'.staging.'.getmypid();
        file_put_contents($staging, $marked);
        rename($staging, config_path('canvas.php'));

        $this->artisan('canvas:publish')
            ->assertExitCode(0);

        expect(file_get_contents(config_path('canvas.php')))->toContain('canvas-config-sentinel');
    });
});

it('overwrites the config when --force is passed', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
        $this->artisan('canvas:publish');

        $marked = file_get_contents(config_path('canvas.php'));
        $marked = preg_replace('/<\?php/', "<?php\n// canvas-config-sentinel", $marked, 1);
        $staging = config_path('canvas.php').'.staging.'.getmypid();
        file_put_contents($staging, $marked);
        rename($staging, config_path('canvas.php'));

        $this->artisan('canvas:publish', ['--force' => true])
            ->assertExitCode(0);

        expect(file_get_contents(config_path('canvas.php')))
            ->not->toContain('canvas-config-sentinel')
            ->toContain("'path' => env('CANVAS_PATH', 'canvas')");
    });
});

it('always republishes vendor assets', function (): void {
    TestCase::withSharedTestbenchLock(function (): void {
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
});
